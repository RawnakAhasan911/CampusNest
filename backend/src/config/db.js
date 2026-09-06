const mongoose = require('mongoose');
const { keyManager } = require('../crypto/keyManager');
const { KeyStore } = require('../models/KeyStore');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_housing';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Connected successfully to MongoDB at ${mongoUri}`);

    // Storage adapter for Key Management Module
    const storageAdapter = {
      async loadKeys() {
        try {
          const doc = await KeyStore.findOne({ keyId: 'system_master_keystore' });
          if (doc) {
            return {
              rsaKeys: doc.rsaKeys,
              eccKeys: doc.eccKeys,
              history: doc.history,
            };
          }
        } catch (e) {
          console.warn('[KMM] Could not load stored keys from DB:', e.message);
        }
        return null;
      },
      async saveKeys(data) {
        try {
          await KeyStore.findOneAndUpdate(
            { keyId: 'system_master_keystore' },
            {
              rsaKeys: data.rsaKeys,
              eccKeys: data.eccKeys,
              history: data.history,
              updatedAt: new Date(),
            },
            { upsert: true, new: true }
          );
        } catch (e) {
          console.warn('[KMM] Could not save keys to DB:', e.message);
        }
      },
    };

    // Initialize Key Management Module
    await keyManager.init(storageAdapter);
    console.log(`[KMM] Key Management Module initialized. Active RSA: v${keyManager.activeRsaVersion}, Active ECC: v${keyManager.activeEccVersion}`);

  } catch (error) {
    console.error(`[Database] Error connecting to MongoDB: ${error.message}`);
    console.log('[KMM] Initializing Key Manager in memory...');
    await keyManager.init();
  }
}

module.exports = { connectDB };
