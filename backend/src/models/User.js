/**
 * User Model
 * All personal data (Name, Email, Phone, Dept, Year, Private Key) is strictly
 * encrypted using RSA Asymmetric Encryption with PKCS#1 v1.5 padding and HMAC-SHA256 integrity tags.
 * 2FA OTP codes are encrypted using ECC Asymmetric Encryption.
 */

const mongoose = require('mongoose');
const { encryptDataRSA, decryptDataRSA, encryptDataECC, decryptDataECC } = require('../crypto/encryptionService');
const { keyManager } = require('../crypto/keyManager');

const userSchema = new mongoose.Schema({
  // Cryptographic blind index hash for unique O(1) lookups without exposing plaintext
  emailBlindIndex: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Asymmetrically Encrypted Fields (RSA + HMAC)
  encryptedEmail: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  encryptedName: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  encryptedPhone: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  encryptedDepartment: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  encryptedYearOfStudy: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },

  // Passwords hashed using pure PBKDF2-HMAC-SHA256 with unique random salt
  passwordHash: {
    type: String,
    required: true,
  },

  // Role-Based Access Control: 'student' or 'admin'
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },

  // University Email Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Verification OTP encrypted using ECC Asymmetric Encryption
  verificationOtpEncrypted: {
    C1: { x: String, y: String },
    C2: String,
    mac: String,
    algorithm: String,
  },
  verificationOtpExpires: {
    type: Date,
  },

  // Two-Factor Authentication (2FA) OTP encrypted using ECC
  twoFactorOtpEncrypted: {
    C1: { x: String, y: String },
    C2: String,
    mac: String,
    algorithm: String,
  },
  twoFactorOtpExpires: {
    type: Date,
  },

  // User-specific ECC Asymmetric Key Pair for Peer-to-Peer Encrypted Messaging
  eccPublicKey: {
    x: { type: String, required: true },
    y: { type: String, required: true },
  },
  // Private ECC key encrypted with System RSA for zero-knowledge at rest
  encryptedEccPrivateKey: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },

  // Cryptographic Key Version
  keyVersion: {
    type: Number,
    default: 1,
  },

  // Account status
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },

  // Blocked users
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Decrypts sensitive user details using RSA private key and returns plain representation.
 */
userSchema.methods.getDecryptedData = function () {
  const name = this.encryptedName ? decryptDataRSA(this.encryptedName) : '';
  const email = this.encryptedEmail ? decryptDataRSA(this.encryptedEmail) : '';
  const phone = this.encryptedPhone ? decryptDataRSA(this.encryptedPhone) : '';
  const department = this.encryptedDepartment ? decryptDataRSA(this.encryptedDepartment) : '';
  const yearOfStudy = this.encryptedYearOfStudy ? decryptDataRSA(this.encryptedYearOfStudy) : '';

  return {
    _id: this._id,
    name,
    email,
    phone,
    department,
    yearOfStudy,
    role: this.role,
    isVerified: this.isVerified,
    eccPublicKey: this.eccPublicKey,
    status: this.status,
    createdAt: this.createdAt,
  };
};

/**
 * Decrypts user's ECC private key (authorized internal use only).
 */
userSchema.methods.getDecryptedEccPrivateKey = function () {
  if (!this.encryptedEccPrivateKey) return null;
  return decryptDataRSA(this.encryptedEccPrivateKey);
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
