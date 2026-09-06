/**
 * Public Cryptographic Registry & Audit Routes
 * Provides transparent key distribution, algorithm metadata,
 * and cryptographic verification endpoints for security audits.
 */

const express = require('express');
const router = express.Router();
const { keyManager } = require('../crypto/keyManager');
const { sha256 } = require('../crypto/sha256');
const { hmacSha256, cbcMac } = require('../crypto/hmac');
const { rsaEncrypt, rsaDecrypt } = require('../crypto/rsa');
const { eccEncrypt, eccDecrypt } = require('../crypto/ecc');

/**
 * GET /api/crypto/registry
 * Returns public keys, algorithm specifications, and rotation history.
 */
router.get('/registry', (req, res) => {
  const registry = keyManager.getPublicRegistry();
  return res.json({
    success: true,
    cryptographyArchitecture: {
      system: 'Dual Asymmetric Encryption Architecture',
      primaryAsymmetric: 'Algorithm 1: RSA (PKCS#1 v1.5 with custom BigInt math & HMAC tags)',
      secondaryAsymmetric: 'Algorithm 2: ECC (EC-ElGamal on secp256k1 with point operations & HMAC tags)',
      symmetricStatus: 'STRICTLY FORBIDDEN & ZERO SYMMETRIC ENCRYPTION USED',
      hashing: 'FIPS 180-4 SHA-256 (Pure from-scratch implementation)',
      passwordKDF: 'PBKDF2-HMAC-SHA256 (2048 iterations + 128-bit custom PRNG salt)',
      macScheme: 'RFC 2104 HMAC-SHA256 & CBC-MAC for image binaries',
      prng: 'Hardware Jitter & High-Resolution Timer Entropy Accumulator (Hash-DRBG)',
    },
    registry,
  });
});

/**
 * POST /api/crypto/test-demo
 * Security audit verification playground: allows testing custom RSA and ECC encryption.
 */
router.post('/test-demo', (req, res) => {
  const { sampleText = 'University Student Housing Test 2026' } = req.body;

  // 1. RSA Demonstration
  const activeRsa = keyManager.getActiveRsaKey();
  const rsaEnc = rsaEncrypt(sampleText, activeRsa.publicKey);
  const rsaDec = rsaDecrypt(rsaEnc, activeRsa.privateKey);

  // 2. ECC Demonstration
  const activeEcc = keyManager.getActiveEccKey();
  const eccEnc = eccEncrypt(sampleText, activeEcc.publicKey);
  const eccDec = eccDecrypt(eccEnc, activeEcc.privateKey);

  // 3. Hash & HMAC
  const hash = sha256(sampleText);
  const hmac = hmacSha256('audit_key_cse447', sampleText);

  return res.json({
    success: true,
    input: sampleText,
    rsa: {
      algorithm: 'RSA-PKCS1v15-CUSTOM',
      keyVersion: activeRsa.version,
      publicKeyModulus: activeRsa.publicKey.n.slice(0, 32) + '...',
      ciphertextBlocksCount: rsaEnc.blocks.length,
      sampleBlock: rsaEnc.blocks[0],
      mac: rsaEnc.mac,
      decryptedMatchesInput: rsaDec === sampleText,
    },
    ecc: {
      algorithm: 'ECC-ELGAMAL-SECP256K1',
      curve: 'secp256k1',
      ephemeralPointC1: { x: eccEnc.C1.x.slice(0, 16) + '...', y: eccEnc.C1.y.slice(0, 16) + '...' },
      ciphertextC2Sample: eccEnc.C2.slice(0, 32) + '...',
      mac: eccEnc.mac,
      decryptedMatchesInput: eccDec === sampleText,
    },
    sha256: hash,
    hmac: hmac,
  });
});

module.exports = router;
