/**
 * Student Profile Model
 * Bio, location preferences, and personal details are encrypted with RSA.
 * Privacy flags control public visibility.
 */

const mongoose = require('mongoose');
const { encryptDataRSA, decryptDataRSA } = require('../crypto/encryptionService');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // Encrypted Profile Fields (RSA + HMAC)
  encryptedBio: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  encryptedPreferredLocation: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },

  // Numeric and standard filter fields
  ageRange: {
    type: String, // e.g. "18-21", "22-25", "26+"
    default: '18-21',
  },
  preferredRentMin: {
    type: Number,
    default: 400,
  },
  preferredRentMax: {
    type: Number,
    default: 1200,
  },
  targetMoveInDate: {
    type: String,
    default: '',
  },

  // Lifestyle Preferences for Roommate Compatibility Matching
  lifestyle: {
    smoking: {
      type: String,
      enum: ['non-smoker', 'outside-only', 'smoker'],
      default: 'non-smoker',
    },
    pets: {
      type: String,
      enum: ['no-pets', 'cat', 'dog', 'other'],
      default: 'no-pets',
    },
    sleepSchedule: {
      type: String,
      enum: ['early-bird', 'night-owl', 'flexible'],
      default: 'flexible',
    },
    studyHabits: {
      type: String,
      enum: ['quiet-study', 'background-music', 'group-study'],
      default: 'quiet-study',
    },
    cleanliness: {
      type: String,
      enum: ['very-clean', 'average', 'relaxed'],
      default: 'average',
    },
    noisePreference: {
      type: String,
      enum: ['quiet', 'moderate', 'lively'],
      default: 'quiet',
    },
    cookingHabits: {
      type: String,
      enum: ['daily', 'occasional', 'rarely', 'strict-diet'],
      default: 'occasional',
    },
    guestPreference: {
      type: String,
      enum: ['rarely', 'weekends', 'flexible'],
      default: 'weekends',
    },
  },

  // Privacy Controls
  privacy: {
    showPhone: { type: Boolean, default: false }, // Phone hidden by default
    showEmail: { type: Boolean, default: false },
    showAge: { type: Boolean, default: true },
    showBudget: { type: Boolean, default: true },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * Decrypts profile details and applies privacy filters for public viewing.
 */
profileSchema.methods.getDecryptedProfile = function (isOwnerOrAdmin = false) {
  const bio = this.encryptedBio ? decryptDataRSA(this.encryptedBio) : '';
  const preferredLocation = this.encryptedPreferredLocation ? decryptDataRSA(this.encryptedPreferredLocation) : '';

  return {
    _id: this._id,
    userId: this.userId,
    bio,
    preferredLocation,
    ageRange: (isOwnerOrAdmin || this.privacy.showAge) ? this.ageRange : 'Hidden',
    preferredRentMin: (isOwnerOrAdmin || this.privacy.showBudget) ? this.preferredRentMin : null,
    preferredRentMax: (isOwnerOrAdmin || this.privacy.showBudget) ? this.preferredRentMax : null,
    targetMoveInDate: this.targetMoveInDate,
    lifestyle: this.lifestyle,
    privacy: this.privacy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = { Profile };
