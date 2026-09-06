const mongoose = require('mongoose');

const keyStoreSchema = new mongoose.Schema({
  keyId: { type: String, default: 'system_master_keystore', unique: true },
  rsaKeys: { type: Array, default: [] },
  eccKeys: { type: Array, default: [] },
  history: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now },
});

const KeyStore = mongoose.model('KeyStore', keyStoreSchema);

module.exports = { KeyStore };
