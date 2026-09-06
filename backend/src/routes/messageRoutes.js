/**
 * Secure Peer-to-Peer Messaging Routes
 * Enforces Accepted-Connection prerequisite.
 * All messages are encrypted exclusively using pure Elliptic Curve Cryptography
 * (EC-ElGamal on secp256k1) and signed with HMAC-SHA256 integrity tags.
 */

const express = require('express');
const router = express.Router();
const { Message } = require('../models/Message');
const { RoommateRequest } = require('../models/RoommateRequest');
const { User } = require('../models/User');
const { Notification } = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const {
  encryptDataECC,
  decryptDataECC,
  encryptDataRSA,
} = require('../crypto/encryptionService');

/**
 * Helper to compute deterministic conversation ID
 */
function getConversationId(userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join('_');
}

/**
 * Helper to check if two users have an accepted roommate connection
 */
async function hasAcceptedConnection(userId1, userId2) {
  const conn = await RoommateRequest.findOne({
    $or: [
      { senderId: userId1, receiverId: userId2, status: 'accepted' },
      { senderId: userId2, receiverId: userId1, status: 'accepted' },
    ],
  });
  return Boolean(conn);
}

/**
 * GET /api/messages/conversations
 * Lists all active conversations (accepted connections).
 */
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const acceptedRequests = await RoommateRequest.find({
      $or: [
        { senderId: req.user._id, status: 'accepted' },
        { receiverId: req.user._id, status: 'accepted' },
      ],
    }).populate('senderId receiverId');

    const conversations = [];

    for (const reqDoc of acceptedRequests) {
      const isSender = reqDoc.senderId._id.toString() === req.user._id.toString();
      const partner = isSender ? reqDoc.receiverId : reqDoc.senderId;
      if (!partner || partner.status === 'suspended') continue;

      const partnerData = partner.getDecryptedData();
      const convId = getConversationId(req.user._id, partner._id);

      // Get last message
      const lastMsg = await Message.findOne({ conversationId: convId }).sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        conversationId: convId,
        receiverId: req.user._id,
        read: false,
      });

      conversations.push({
        conversationId: convId,
        partner: {
          _id: partnerData._id,
          name: partnerData.name,
          department: partnerData.department,
          yearOfStudy: partnerData.yearOfStudy,
          eccPublicKey: partnerData.eccPublicKey,
        },
        hasUnread: unreadCount > 0,
        unreadCount,
        lastMessageTime: lastMsg ? lastMsg.createdAt : reqDoc.updatedAt,
      });
    }

    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return res.json({ success: true, conversations });
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conversations' });
  }
});

/**
 * GET /api/messages/history/:partnerId
 * Retrieves full conversation history between authenticated user and accepted partner.
 * Decrypts messages using current student's private ECC key.
 */
router.get('/history/:partnerId', authenticate, async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    // 7.1 Verify accepted roommate connection
    const isConnected = await hasAcceptedConnection(req.user._id, partnerId);
    if (!isConnected) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You must have an accepted roommate connection before messaging this student.',
      });
    }

    const convId = getConversationId(req.user._id, partnerId);
    const messages = await Message.find({ conversationId: convId }).sort({ createdAt: 1 });

    // Mark unread messages as read
    await Message.updateMany(
      { conversationId: convId, receiverId: req.user._id, read: false },
      { $set: { read: true } }
    );

    // Retrieve user's decrypted ECC private key
    const userEccPrivateKey = req.user.getDecryptedEccPrivateKey();
    if (!userEccPrivateKey) {
      return res.status(500).json({ success: false, message: 'Unable to decrypt user cryptographic keys' });
    }

    const decryptedMessages = messages.map(msg => {
      const isMe = msg.senderId.toString() === req.user._id.toString();
      const targetCipher = isMe ? msg.encryptedForSender : msg.encryptedForRecipient;

      let plainText = '';
      let integrityVerified = false;

      try {
        plainText = decryptDataECC(targetCipher, userEccPrivateKey);
        integrityVerified = true;
      } catch (err) {
        plainText = '[Message Decryption Error / Tamper Detected]';
        integrityVerified = false;
      }

      return {
        _id: msg._id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        isMe,
        content: plainText,
        integrityVerified,
        algorithm: 'ECC-ELGAMAL-SECP256K1',
        createdAt: msg.createdAt,
      };
    });

    return res.json({
      success: true,
      count: decryptedMessages.length,
      messages: decryptedMessages,
    });
  } catch (error) {
    console.error('Message history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve message history' });
  }
});

/**
 * POST /api/messages/send
 * Asymmetrically encrypts a message with ECC and sends to connected roommate.
 */
router.post('/send', authenticate, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Receiver ID and content are required' });
    }

    // 7.1 Verify accepted roommate connection
    const isConnected = await hasAcceptedConnection(req.user._id, receiverId);
    if (!isConnected) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Conversations can only be initiated after a roommate request has been accepted.',
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.status === 'suspended') {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const convId = getConversationId(req.user._id, receiver._id);
    const cleanContent = content.trim();

    // 7.2 Encrypt message using ECC Asymmetric Encryption
    // Copy 1: Encrypted with Recipient's ECC Public Key
    const encryptedForRecipient = encryptDataECC(cleanContent, receiver.eccPublicKey);

    // Copy 2: Encrypted with Sender's ECC Public Key (for sender's history decryption)
    const encryptedForSender = encryptDataECC(cleanContent, req.user.eccPublicKey);

    const message = new Message({
      conversationId: convId,
      senderId: req.user._id,
      receiverId: receiver._id,
      encryptedForRecipient,
      encryptedForSender,
    });

    await message.save();

    // 10.3 New message notification
    const senderData = req.user.getDecryptedData();
    const notif = new Notification({
      userId: receiver._id,
      type: 'NEW_MESSAGE',
      title: 'New Encrypted Message',
      encryptedMessage: encryptDataRSA(`You have a new private message from ${senderData.name}.`),
      metadata: { senderId: req.user._id, conversationId: convId },
    });
    await notif.save();

    return res.status(201).json({
      success: true,
      message: 'Message securely encrypted with ECC-ElGamal and sent!',
      messageRecord: {
        _id: message._id,
        conversationId: convId,
        senderId: req.user._id,
        receiverId: receiver._id,
        content: cleanContent,
        isMe: true,
        algorithm: 'ECC-ELGAMAL-SECP256K1',
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message: ' + error.message });
  }
});

module.exports = router;
