const mongoose = require('mongoose');
const { decryptDataRSA } = require('../crypto/encryptionService');

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  encryptedComment: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.methods.getDecryptedComment = function () {
  return this.encryptedComment ? decryptDataRSA(this.encryptedComment) : '';
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = { Review };
