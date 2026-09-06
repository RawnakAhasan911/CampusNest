/**
 * Roommate Connection Request Routes
 * Handles connection requests with ECC-encrypted notes, status tracking,
 * and automatic real-time notifications.
 */

const express = require('express');
const router = express.Router();
const { RoommateRequest } = require('../models/RoommateRequest');
const { User } = require('../models/User');
const { Notification } = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const { encryptDataECC, decryptDataECC, encryptDataRSA } = require('../crypto/encryptionService');

/**
 * POST /api/requests
 * Send a roommate connection request with ECC-encrypted introduction note.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiverId, note } = req.body;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver ID is required' });
    }

    // 6.2 Prevent self-requests
    if (receiverId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a roommate connection request to yourself!' });
    }

    // Check if target user exists and is active
    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.status === 'suspended') {
      return res.status(404).json({ success: false, message: 'Student account not found or suspended' });
    }

    // Check blocked status
    if (req.user.blockedUsers && req.user.blockedUsers.some(b => b.toString() === receiverId)) {
      return res.status(403).json({ success: false, message: 'You have blocked this user.' });
    }
    if (receiver.blockedUsers && receiver.blockedUsers.some(b => b.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You cannot connect with this student.' });
    }

    // Prevent duplicate pending or accepted requests
    const existing = await RoommateRequest.findOne({
      $or: [
        { senderId: req.user._id, receiverId, status: { $in: ['pending', 'accepted'] } },
        { senderId: receiverId, receiverId: req.user._id, status: { $in: ['pending', 'accepted'] } },
      ],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.status === 'accepted'
          ? 'You are already connected with this student!'
          : 'A pending connection request already exists between you and this student.',
      });
    }

    // Encrypt introduction note using Receiver's ECC Public Point
    let encryptedNote = null;
    if (note && note.trim()) {
      encryptedNote = encryptDataECC(note.trim(), receiver.eccPublicKey);
    }

    const request = new RoommateRequest({
      senderId: req.user._id,
      receiverId,
      encryptedNote,
      status: 'pending',
    });

    await request.save();

    // 10.1 Roommate request notification
    const senderData = req.user.getDecryptedData();
    const notif = new Notification({
      userId: receiver._id,
      type: 'REQUEST_RECEIVED',
      title: 'New Roommate Request!',
      encryptedMessage: encryptDataRSA(`${senderData.name} sent you a roommate connection request.`),
      metadata: { requestId: request._id, senderId: req.user._id },
    });
    await notif.save();

    return res.status(201).json({
      success: true,
      message: 'Connection request sent with ECC-encrypted note!',
      requestId: request._id,
    });
  } catch (error) {
    console.error('Send request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send request: ' + error.message });
  }
});

/**
 * GET /api/requests/received
 * Retrieves all requests received by the current student.
 */
router.get('/received', authenticate, async (req, res) => {
  try {
    const requests = await RoommateRequest.find({ receiverId: req.user._id })
      .populate('senderId')
      .sort({ createdAt: -1 });

    const decryptedUserKey = req.user.getDecryptedEccPrivateKey();

    const formatted = requests.map(r => {
      const sender = r.senderId;
      const senderData = sender ? sender.getDecryptedData() : { name: 'Unknown' };

      // Decrypt note if present using receiver's ECC private key
      let note = '';
      if (r.encryptedNote && decryptedUserKey) {
        try {
          note = decryptDataECC(r.encryptedNote, decryptedUserKey);
        } catch (e) {
          note = '[Encrypted Note]';
        }
      }

      return {
        _id: r._id,
        sender: {
          _id: senderData._id,
          name: senderData.name,
          department: senderData.department,
          yearOfStudy: senderData.yearOfStudy,
          eccPublicKey: senderData.eccPublicKey,
        },
        note,
        status: r.status,
        responseNote: r.responseNote,
        createdAt: r.createdAt,
      };
    });

    return res.json({ success: true, requests: formatted });
  } catch (error) {
    console.error('Get received requests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load requests' });
  }
});

/**
 * GET /api/requests/sent
 * Retrieves all requests sent by current student.
 */
router.get('/sent', authenticate, async (req, res) => {
  try {
    const requests = await RoommateRequest.find({ senderId: req.user._id })
      .populate('receiverId')
      .sort({ createdAt: -1 });

    const formatted = requests.map(r => {
      const receiver = r.receiverId;
      const receiverData = receiver ? receiver.getDecryptedData() : { name: 'Unknown' };

      return {
        _id: r._id,
        receiver: {
          _id: receiverData._id,
          name: receiverData.name,
          department: receiverData.department,
          yearOfStudy: receiverData.yearOfStudy,
          eccPublicKey: receiverData.eccPublicKey,
        },
        status: r.status,
        responseNote: r.responseNote,
        createdAt: r.createdAt,
      };
    });

    return res.json({ success: true, requests: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load sent requests' });
  }
});

/**
 * PATCH /api/requests/:id/accept
 * Accept a roommate request.
 */
router.patch('/:id/accept', authenticate, async (req, res) => {
  try {
    const request = await RoommateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the recipient can accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot accept a ${request.status} request` });
    }

    request.status = 'accepted';
    request.updatedAt = new Date();
    await request.save();

    // 10.2 Request status change notification
    const receiverData = req.user.getDecryptedData();
    const notif = new Notification({
      userId: request.senderId,
      type: 'REQUEST_ACCEPTED',
      title: 'Roommate Request Accepted!',
      encryptedMessage: encryptDataRSA(`${receiverData.name} accepted your roommate connection request! You can now start encrypted messaging.`),
      metadata: { requestId: request._id, acceptedBy: req.user._id },
    });
    await notif.save();

    return res.json({
      success: true,
      message: 'Roommate request accepted! You can now exchange encrypted messages.',
      request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to accept request' });
  }
});

/**
 * PATCH /api/requests/:id/decline
 * Decline a roommate request.
 */
router.patch('/:id/decline', authenticate, async (req, res) => {
  try {
    const request = await RoommateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the recipient can decline this request' });
    }

    request.status = 'declined';
    request.updatedAt = new Date();
    await request.save();

    // 10.2 Request status change notification
    const notif = new Notification({
      userId: request.senderId,
      type: 'REQUEST_DECLINED',
      title: 'Roommate Request Update',
      encryptedMessage: encryptDataRSA('A roommate connection request was declined.'),
      metadata: { requestId: request._id },
    });
    await notif.save();

    return res.json({ success: true, message: 'Request declined.', request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to decline request' });
  }
});

/**
 * PATCH /api/requests/:id/cancel
 * Cancel a pending request (Sender only).
 */
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const request = await RoommateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the sender can cancel this request' });
    }

    request.status = 'cancelled';
    request.updatedAt = new Date();
    await request.save();

    return res.json({ success: true, message: 'Request cancelled successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel request' });
  }
});

module.exports = router;
