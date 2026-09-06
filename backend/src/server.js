/**
 * Application Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seeds/seedData');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to Database and Initialize Key Management Module
    await connectDB();

    // 2. Seed initial demo accounts and listings
    await seedDatabase();

    // 3. Start Express Listener
    app.listen(PORT, () => {
      console.log('===========================================================');
      console.log(` Student Housing & Roommate Finder Backend Running on :${PORT}`);
      console.log(' Security: Pure From-Scratch Dual Asymmetric Cryptography');
      console.log(' - Algorithm 1: RSA-512 (PKCS#1 v1.5 + HMAC Integrity)');
      console.log(' - Algorithm 2: ECC secp256k1 (EC-ElGamal Asymmetric Cipher)');
      console.log(' - Password KDF: PBKDF2-HMAC-SHA256 (2048 iterations)');
      console.log(' - 2FA Verification: 2-Step OTP Authentication Active');
      console.log('===========================================================');
    });
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
