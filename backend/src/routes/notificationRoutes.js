/**
 * In-App Notification Routes
 * Dispatches and retrieves real-time alerts. Messages are RSA-encrypted.
 */

const express = require('express');
const router = express.Router();
const { Notification } = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Retrieves notifications for the authenticated student.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const decrypted = notifications.map(n => ({
      _id: n._id,
      type: n.type,
      title: n.title,
      message: n.getDecryptedMessage(),
      metadata: n.metadata,
      read: n.read,
      createdAt: n.createdAt,
    }));

    return res.json({ success: true, notifications: decrypted });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Quick badge count for navbar.
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    return res.json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, count: 0 });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read.
 */
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read.
 */
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
