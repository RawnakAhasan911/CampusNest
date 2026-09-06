const mongoose = require('mongoose');
const { decryptDataRSA } = require('../crypto/encryptionService');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['REQUEST_RECEIVED', 'REQUEST_ACCEPTED', 'REQUEST_DECLINED', 'NEW_MESSAGE', 'HOUSING_MATCH'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  encryptedMessage: {
    blocks: [String],
    mac: String,
    keyVersion: Number,
    algorithm: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.methods.getDecryptedMessage = function () {
  return this.encryptedMessage ? decryptDataRSA(this.encryptedMessage) : '';
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
