/**
 * Roommate Connection Request Model
 * Notes/messages between potential roommates are encrypted using pure ECC.
 */

const mongoose = require('mongoose');

const roommateRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Note encrypted with ECC for the receiver
  encryptedNote: {
    C1: { x: String, y: String },
    C2: String,
    mac: String,
    algorithm: String,
  },

  // Statuses: 'pending', 'accepted', 'declined', 'cancelled'
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
    index: true,
  },

  responseNote: {
    type: String,
    default: '',
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index to prevent duplicate pending requests
roommateRequestSchema.index({ senderId: 1, receiverId: 1 });

const RoommateRequest = mongoose.model('RoommateRequest', roommateRequestSchema);

module.exports = { RoommateRequest };
