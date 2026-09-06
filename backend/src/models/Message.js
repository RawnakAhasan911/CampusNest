/**
 * Secure Message Model
 * All messages are encrypted exclusively using pure Elliptic Curve Cryptography (ECC - secp256k1)
 * via EC-ElGamal point operations and authenticated with HMAC-SHA256 integrity tags.
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
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

  // ECC Ciphertext for Recipient (encrypted with Recipient's ECC Public Key)
  encryptedForRecipient: {
    C1: { x: String, y: String },
    C2: String,
    mac: String,
    algorithm: { type: String, default: 'ECC-ELGAMAL-SECP256K1' },
  },

  // ECC Ciphertext for Sender (encrypted with Sender's ECC Public Key for sent-history retrieval)
  encryptedForSender: {
    C1: { x: String, y: String },
    C2: String,
    mac: String,
    algorithm: { type: String, default: 'ECC-ELGAMAL-SECP256K1' },
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

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = { Message };
