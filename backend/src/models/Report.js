const mongoose = require('mongoose');
const { decryptDataRSA } = require('../crypto/encryptionService');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['user', 'listing', 'review'],
    required: true,
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reportedListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
  },
  reportedReviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  },
  reason: {
    type: String,
    required: true,
  },
  encryptedDetails: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reportSchema.methods.getDecryptedDetails = function () {
  return this.encryptedDetails ? decryptDataRSA(this.encryptedDetails) : '';
};

const Report = mongoose.model('Report', reportSchema);

module.exports = { Report };
