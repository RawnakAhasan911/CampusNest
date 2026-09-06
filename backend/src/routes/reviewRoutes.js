/**
 * Review & Rating Routes
 * Enforces Accepted-Connection prerequisite.
 * Encrypts comments using RSA with HMAC integrity.
 */

const express = require('express');
const router = express.Router();
const { Review } = require('../models/Review');
const { RoommateRequest } = require('../models/RoommateRequest');
const { User } = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { encryptDataRSA } = require('../crypto/encryptionService');

/**
 * POST /api/reviews
 * Leave a review for a connected roommate.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { targetUserId, rating, comment } = req.body;

    if (!targetUserId || !rating) {
      return res.status(400).json({ success: false, message: 'Target user and rating (1-5) are required' });
    }

    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself' });
    }

    // 9.3 Verify accepted roommate connection
    const connection = await RoommateRequest.findOne({
      $or: [
        { senderId: req.user._id, receiverId: targetUserId, status: 'accepted' },
        { senderId: targetUserId, receiverId: req.user._id, status: 'accepted' },
      ],
    });

    if (!connection && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Review authorization denied: You can only review roommates with whom you have an accepted connection.',
      });
    }

    // Encrypt comment with RSA
    const encryptedComment = comment ? encryptDataRSA(comment.trim()) : null;

    const review = new Review({
      reviewerId: req.user._id,
      targetUserId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      encryptedComment,
    });

    await review.save();

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully with RSA encryption!',
      review: {
        _id: review._id,
        rating: review.rating,
        comment: comment ? comment.trim() : '',
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create review' });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Retrieves reviews and average rating for a student.
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({
      targetUserId: req.params.userId,
      isReported: false,
    }).populate('reviewerId').sort({ createdAt: -1 });

    let sum = 0;
    const decryptedList = reviews.map(r => {
      sum += r.rating;
      const reviewer = r.reviewerId;
      const reviewerName = reviewer ? reviewer.getDecryptedData().name : 'Verified Student';

      return {
        _id: r._id,
        reviewerId: r.reviewerId ? r.reviewerId._id : null,
        reviewerName,
        rating: r.rating,
        comment: r.getDecryptedComment(),
        createdAt: r.createdAt,
      };
    });

    const avgRating = reviews.length > 0 ? (sum / reviews.length).toFixed(1) : 'New';

    return res.json({
      success: true,
      count: reviews.length,
      averageRating: avgRating,
      reviews: decryptedList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews' });
  }
});

/**
 * POST /api/reviews/:id/report
 * Flag a review as inappropriate.
 */
router.post('/:id/report', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isReported = true;
    await review.save();

    return res.json({ success: true, message: 'Review reported to admin for moderation' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to report review' });
  }
});

module.exports = router;
