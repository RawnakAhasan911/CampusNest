/**
 * Safety & Reporting Routes
 * Handles reporting users, listings, and user blocking.
 */

const express = require('express');
const router = express.Router();
const { Report } = require('../models/Report');
const { User } = require('../models/User');
const { Listing } = require('../models/Listing');
const { authenticate } = require('../middleware/auth');
const { encryptDataRSA } = require('../crypto/encryptionService');

/**
 * POST /api/reports
 * Submit a report against a user, listing, or review.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { targetType, reportedUserId, reportedListingId, reportedReviewId, reason, details } = req.body;

    if (!targetType || !reason) {
      return res.status(400).json({ success: false, message: 'Target type and reason are required' });
    }

    const encryptedDetails = details ? encryptDataRSA(details.trim()) : null;

    const report = new Report({
      reporterId: req.user._id,
      targetType,
      reportedUserId: reportedUserId || undefined,
      reportedListingId: reportedListingId || undefined,
      reportedReviewId: reportedReviewId || undefined,
      reason: reason.trim(),
      encryptedDetails,
      status: 'pending',
    });

    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Report submitted securely. Our safety team will review it shortly.',
      reportId: report._id,
    });
  } catch (error) {
    console.error('Submit report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
});

/**
 * POST /api/reports/block/:userId
 * Block a student user.
 */
router.post('/block/:userId', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    if (!req.user.blockedUsers) req.user.blockedUsers = [];
    if (!req.user.blockedUsers.includes(targetUserId)) {
      req.user.blockedUsers.push(targetUserId);
      await req.user.save();
    }

    return res.json({ success: true, message: 'User blocked successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to block user' });
  }
});

/**
 * DELETE /api/reports/block/:userId
 * Unblock a student user.
 */
router.delete('/block/:userId', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (req.user.blockedUsers) {
      req.user.blockedUsers = req.user.blockedUsers.filter(id => id.toString() !== targetUserId);
      await req.user.save();
    }
    return res.json({ success: true, message: 'User unblocked successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
});

/**
 * GET /api/reports/blocked
 * Get list of blocked users.
 */
router.get('/blocked', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers');
    const blockedList = (user.blockedUsers || []).map(u => ({
      _id: u._id,
      name: u.getDecryptedData().name,
      department: u.getDecryptedData().department,
    }));
    return res.json({ success: true, blockedUsers: blockedList });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load blocked users' });
  }
});

module.exports = router;
