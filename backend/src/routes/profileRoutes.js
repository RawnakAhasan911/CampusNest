/**
 * Student Profile Routes
 * Handles student profile CRUD, lifestyle preferences, privacy settings,
 * and automatic RSA re-encryption.
 */

const express = require('express');
const router = express.Router();
const { Profile } = require('../models/Profile');
const { User } = require('../models/User');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { encryptDataRSA, decryptDataRSA } = require('../crypto/encryptionService');

/**
 * GET /api/profiles/me
 * Retrieves current student's full profile.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new Profile({ userId: req.user._id });
      await profile.save();
    }

    const decryptedUser = req.user.getDecryptedData();
    const decryptedProfile = profile.getDecryptedProfile(true);

    return res.json({
      success: true,
      user: decryptedUser,
      profile: decryptedProfile,
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

/**
 * PUT /api/profiles/me
 * Updates student profile & user info with automatic RSA re-encryption.
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const {
      name,
      phone,
      department,
      yearOfStudy,
      bio,
      preferredLocation,
      ageRange,
      preferredRentMin,
      preferredRentMax,
      targetMoveInDate,
      lifestyle,
      privacy,
    } = req.body;

    // 1. Update User personal fields with RSA re-encryption
    if (name) req.user.encryptedName = encryptDataRSA(name.trim());
    if (phone) req.user.encryptedPhone = encryptDataRSA(phone.trim());
    if (department) req.user.encryptedDepartment = encryptDataRSA(department.trim());
    if (yearOfStudy) req.user.encryptedYearOfStudy = encryptDataRSA(yearOfStudy.trim());
    req.user.updatedAt = new Date();
    await req.user.save();

    // 2. Update Profile fields with RSA re-encryption
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new Profile({ userId: req.user._id });
    }

    if (bio !== undefined) {
      profile.encryptedBio = encryptDataRSA(bio.trim());
    }
    if (preferredLocation !== undefined) {
      profile.encryptedPreferredLocation = encryptDataRSA(preferredLocation.trim());
    }
    if (ageRange !== undefined) profile.ageRange = ageRange;
    if (preferredRentMin !== undefined) profile.preferredRentMin = Number(preferredRentMin);
    if (preferredRentMax !== undefined) profile.preferredRentMax = Number(preferredRentMax);
    if (targetMoveInDate !== undefined) profile.targetMoveInDate = targetMoveInDate;

    if (lifestyle && typeof lifestyle === 'object') {
      profile.lifestyle = { ...profile.lifestyle, ...lifestyle };
    }

    if (privacy && typeof privacy === 'object') {
      profile.privacy = { ...profile.privacy, ...privacy };
    }

    profile.updatedAt = new Date();
    await profile.save();

    return res.json({
      success: true,
      message: 'Profile successfully updated and securely re-encrypted!',
      user: req.user.getDecryptedData(),
      profile: profile.getDecryptedProfile(true),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile: ' + error.message });
  }
});

/**
 * GET /api/profiles/:userId
 * Public student profile view, respecting privacy toggles.
 */
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await Profile.findOne({ userId: targetUser._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const isOwner = req.user && req.user._id.toString() === targetUser._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    const canSeePrivate = isOwner || isAdmin;

    const decryptedUser = targetUser.getDecryptedData();
    const decryptedProfile = profile.getDecryptedProfile(canSeePrivate);

    // Apply privacy filter to contact information
    const publicUserData = {
      _id: decryptedUser._id,
      name: decryptedUser.name,
      department: decryptedUser.department,
      yearOfStudy: decryptedUser.yearOfStudy,
      eccPublicKey: decryptedUser.eccPublicKey,
      // Phone is hidden unless toggle is on or viewer is owner/admin
      phone: (canSeePrivate || profile.privacy.showPhone) ? decryptedUser.phone : null,
      email: (canSeePrivate || profile.privacy.showEmail) ? decryptedUser.email : null,
      createdAt: decryptedUser.createdAt,
    };

    return res.json({
      success: true,
      user: publicUserData,
      profile: decryptedProfile,
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving profile' });
  }
});

module.exports = router;
