/**
 * Admin Panel Routes
 * RBAC Protected: Requires 'admin' role.
 * User management, listing moderation, report management, review removal,
 * category configuration, and Key Management Module (KMM) controls.
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Listing } = require('../models/Listing');
const { Report } = require('../models/Report');
const { Review } = require('../models/Review');
const { Category } = require('../models/Category');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { keyManager } = require('../crypto/keyManager');
const { revokeAllUserSessions } = require('../middleware/sessionManager');

// Protect all admin endpoints with RBAC
router.use(authenticate, requireRole('admin'));

/**
 * GET /api/admin/dashboard
 * Summary statistics & cryptographic health metrics.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeStudents = await User.countDocuments({ role: 'student', status: 'active' });
    const totalListings = await Listing.countDocuments({ status: { $ne: 'removed' } });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const reportedReviews = await Review.countDocuments({ isReported: true });

    const keyRegistry = keyManager.getPublicRegistry();

    return res.json({
      success: true,
      metrics: {
        totalUsers,
        activeStudents,
        totalListings,
        pendingReports,
        reportedReviews,
      },
      cryptography: {
        activeRsaVersion: keyRegistry.activeRsaVersion,
        activeEccVersion: keyRegistry.activeEccVersion,
        totalRsaKeys: keyRegistry.rsaKeys.length,
        totalEccKeys: keyRegistry.eccKeys.length,
        rotationHistory: keyRegistry.rotationHistory,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard metrics' });
  }
});

/**
 * GET /api/admin/users
 * Manage Users: list all users with decrypted identities.
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const decryptedUsers = users.map(u => ({
      ...u.getDecryptedData(),
      role: u.role,
      status: u.status,
      keyVersion: u.keyVersion,
      createdAt: u.createdAt,
    }));
    return res.json({ success: true, users: decryptedUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load users' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Suspend or activate a user account.
 */
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    if (status === 'suspended') {
      revokeAllUserSessions(user._id.toString());
    }

    return res.json({ success: true, message: `User status changed to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Remove a user account.
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = 'suspended';
    await user.save();
    revokeAllUserSessions(user._id.toString());

    return res.json({ success: true, message: 'User removed/suspended' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove user' });
  }
});

/**
 * GET /api/admin/listings
 * Manage Listings: view all listings.
 */
router.get('/listings', async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    const decrypted = listings.map(l => l.getDecryptedListing());
    return res.json({ success: true, listings: decrypted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load listings' });
  }
});

/**
 * DELETE /api/admin/listings/:id
 * Remove an inappropriate listing.
 */
router.delete('/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    listing.status = 'removed';
    await listing.save();

    return res.json({ success: true, message: 'Listing removed by administrator' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove listing' });
  }
});

/**
 * GET /api/admin/reports
 * Manage Reports: list all reports.
 */
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().populate('reporterId').sort({ createdAt: -1 });
    const formatted = reports.map(r => ({
      _id: r._id,
      reporter: r.reporterId ? r.reporterId.getDecryptedData().name : 'Unknown',
      targetType: r.targetType,
      reportedUserId: r.reportedUserId,
      reportedListingId: r.reportedListingId,
      reportedReviewId: r.reportedReviewId,
      reason: r.reason,
      details: r.getDecryptedDetails(),
      status: r.status,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt,
    }));
    return res.json({ success: true, reports: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load reports' });
  }
});

/**
 * PATCH /api/admin/reports/:id
 * Resolve or dismiss a report.
 */
router.patch('/reports/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    await report.save();

    return res.json({ success: true, message: 'Report updated', report });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update report' });
  }
});

/**
 * GET /api/admin/reviews
 * Manage Reviews: list reported or all reviews.
 */
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().populate('reviewerId targetUserId').sort({ createdAt: -1 });
    const formatted = reviews.map(r => ({
      _id: r._id,
      reviewer: r.reviewerId ? r.reviewerId.getDecryptedData().name : 'Unknown',
      targetUser: r.targetUserId ? r.targetUserId.getDecryptedData().name : 'Unknown',
      rating: r.rating,
      comment: r.getDecryptedComment(),
      isReported: r.isReported,
      createdAt: r.createdAt,
    }));
    return res.json({ success: true, reviews: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
});

/**
 * DELETE /api/admin/reviews/:id
 * Remove an inappropriate review.
 */
router.delete('/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Review removed by administrator' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove review' });
  }
});

/**
 * POST /api/admin/kmm/rotate-rsa
 * Trigger manual RSA cryptographic key rotation.
 */
router.post('/kmm/rotate-rsa', async (req, res) => {
  try {
    const { reason } = req.body;
    const newKey = await keyManager.rotateRsaKey(reason || 'Admin triggered manual key rotation');
    return res.json({
      success: true,
      message: `RSA Key successfully rotated! Active version is now v${newKey.version}.`,
      activeVersion: newKey.version,
      fingerprint: newKey.fingerprint,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to rotate RSA key: ' + error.message });
  }
});

/**
 * POST /api/admin/kmm/rotate-ecc
 * Trigger manual ECC cryptographic key rotation.
 */
router.post('/kmm/rotate-ecc', async (req, res) => {
  try {
    const { reason } = req.body;
    const newKey = await keyManager.rotateEccKey(reason || 'Admin triggered manual key rotation');
    return res.json({
      success: true,
      message: `ECC Key successfully rotated! Active version is now v${newKey.version}.`,
      activeVersion: newKey.version,
      fingerprint: newKey.fingerprint,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to rotate ECC key: ' + error.message });
  }
});

/**
 * GET /api/admin/categories / POST /api/admin/categories
 * Manage Categories / Locations / Property Types.
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ type: 1, name: 1 });
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const cat = new Category({ name, type, description });
    await cat.save();
    return res.status(201).json({ success: true, category: cat });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

module.exports = router;
