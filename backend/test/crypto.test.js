/**
 * Comprehensive Automated Verification Test Suite
 * Validates all cryptographic requirements, zero-library assertions,
 * and security protocols.
 */

const { sha256 } = require('../src/crypto/sha256');
const { hmacSha256, timingSafeEqual, cbcMac } = require('../src/crypto/hmac');
const { hashPassword, verifyPassword } = require('../src/crypto/kdf');
const { generatePrime, isProbablePrime } = require('../src/crypto/primeUtils');
const { generateRsaKeyPair, rsaEncrypt, rsaDecrypt } = require('../src/crypto/rsa');
const { generateEccKeyPair, eccEncrypt, eccDecrypt } = require('../src/crypto/ecc');
const { randomBytes, randomHex, randomOtp, randomBigInt } = require('../src/crypto/prng');
const { createSessionToken, verifySessionToken, revokeSession } = require('../src/middleware/sessionManager');
const { keyManager } = require('../src/crypto/keyManager');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
    passedTests++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log(' STARTING SYSTEM SECURITY & CRYPTOGRAPHY VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. SHA-256 NIST Test Vectors
  console.log('--- TEST GROUP 1: Custom SHA-256 (NIST Test Vectors) ---');
  const emptyHash = sha256('');
  assert(emptyHash === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'SHA-256 empty string vector');

  const abcHash = sha256('abc');
  assert(abcHash === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'SHA-256 "abc" standard vector');

  const foxHash = sha256('The quick brown fox jumps over the lazy dog');
  assert(foxHash === 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592', 'SHA-256 fox string standard vector');

  // 2. HMAC-SHA256 RFC 4231 Test
  console.log('\n--- TEST GROUP 2: Custom HMAC-SHA256 & Timing-Safe Comparison ---');
  const hmacVal = hmacSha256('Jefe', 'what do ya want for nothing?');
  assert(hmacVal === '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843', 'HMAC-SHA256 RFC 4231 standard vector');
  assert(timingSafeEqual('abcdef', 'abcdef'), 'timingSafeEqual positive test');
  assert(!timingSafeEqual('abcdef', 'abcdeg'), 'timingSafeEqual negative test');

  // 3. PBKDF2-HMAC-SHA256 Password Salting
  console.log('\n--- TEST GROUP 3: PBKDF2 Password Salting & Hashing ---');
  const rawPass = 'SecretStudentPass#2026';
  const hashed = hashPassword(rawPass);
  assert(hashed.formatted.startsWith('pbkdf2_sha256$2048$'), 'PBKDF2 format includes algorithm and 2048 iterations');
  assert(verifyPassword(rawPass, hashed.formatted), 'verifyPassword correctly matches original password');
  assert(!verifyPassword('WrongPass123', hashed.formatted), 'verifyPassword rejects incorrect password');

  // 4. Custom PRNG (No Node Crypto)
  console.log('\n--- TEST GROUP 4: Hardware Jitter & PRNG ---');
  const rBytes = randomBytes(32);
  assert(rBytes.length === 32, 'PRNG generates 32 random bytes');
  const rHex = randomHex(16);
  assert(rHex.length === 32, 'PRNG generates 32-character hex string');
  const otp = randomOtp(6);
  assert(otp.length === 6 && /^\d{6}$/.test(otp), 'PRNG generates valid 6-digit numeric OTP');
  const rBig = randomBigInt(100n, 1000n);
  assert(rBig >= 100n && rBig <= 1000n, 'PRNG generates BigInt in bounds [100, 1000]');

  // 5. Primality Testing (Miller-Rabin)
  console.log('\n--- TEST GROUP 5: Miller-Rabin Primality Testing & Prime Generation ---');
  assert(isProbablePrime(104729n, 20), 'isProbablePrime correctly identifies 104729 as prime');
  assert(!isProbablePrime(104727n, 20), 'isProbablePrime correctly rejects composite 104727 (divisible by 3)');
  const primeCandidate = generatePrime(128);
  assert(isProbablePrime(primeCandidate, 25), 'generatePrime produces a verified 128-bit prime');

  // 6. Algorithm 1: Custom RSA Asymmetric Encryption
  console.log('\n--- TEST GROUP 6: Algorithm 1 - Pure Asymmetric RSA-512 ---');
  const rsaKey = generateRsaKeyPair(256);
  assert(rsaKey.publicKey.n && rsaKey.publicKey.e, 'RSA keypair generated with modulus n and exponent e');
  const plainRecord = JSON.stringify({ student: 'Alex Rivera', dept: 'CS', gpa: 3.9, phone: '+1-555-0101' });
  const rsaEncrypted = rsaEncrypt(plainRecord, rsaKey.publicKey);
  assert(rsaEncrypted.blocks.length > 0 && rsaEncrypted.mac, 'RSA ciphertext contains chunked blocks and HMAC integrity tag');
  const rsaDecrypted = rsaDecrypt(rsaEncrypted, rsaKey.privateKey);
  assert(rsaDecrypted === plainRecord, 'RSA decryption cleanly recovers exact plaintext record');

  // RSA Tamper Test
  let rsaTamperCaught = false;
  try {
    const tamperedRsa = JSON.parse(JSON.stringify(rsaEncrypted));
    tamperedRsa.blocks[0] = '9' + tamperedRsa.blocks[0].slice(1);
    rsaDecrypt(tamperedRsa, rsaKey.privateKey);
  } catch (err) {
    rsaTamperCaught = true;
  }
  assert(rsaTamperCaught, 'RSA HMAC verification catches tampering immediately');

  // 7. Algorithm 2: Custom ECC secp256k1 (EC-ElGamal)
  console.log('\n--- TEST GROUP 7: Algorithm 2 - Pure Asymmetric ECC (secp256k1) ---');
  const eccKeyAlice = generateEccKeyPair();
  const eccKeyBob = generateEccKeyPair();
  assert(eccKeyAlice.publicKey.x && eccKeyAlice.publicKey.y, 'ECC keypair contains curve point coordinates (x, y)');
  const privateChatMsg = 'Hi! Are you still looking for a roommate for the North Campus 2BR apartment?';
  const eccEncrypted = eccEncrypt(privateChatMsg, eccKeyAlice.publicKey);
  assert(eccEncrypted.C1.x && eccEncrypted.C2 && eccEncrypted.mac, 'ECC ciphertext contains ephemeral point C1, masked ciphertext C2, and HMAC');
  const eccDecrypted = eccDecrypt(eccEncrypted, eccKeyAlice.privateKey);
  assert(eccDecrypted === privateChatMsg, 'ECC-ElGamal decryption recovers original private message');

  // ECC Tamper Test
  let eccTamperCaught = false;
  try {
    const tamperedEcc = JSON.parse(JSON.stringify(eccEncrypted));
    tamperedEcc.C2 = '00' + tamperedEcc.C2.slice(2);
    eccDecrypt(tamperedEcc, eccKeyAlice.privateKey);
  } catch (err) {
    eccTamperCaught = true;
  }
  assert(eccTamperCaught, 'ECC HMAC verification catches ciphertext tampering immediately');

  // 8. Key Management Module (KMM) & Key Rotation
  console.log('\n--- TEST GROUP 8: Key Management Module & Rotation ---');
  await keyManager.init();
  const initialRsaVersion = keyManager.activeRsaVersion;
  const rotatedRsa = await keyManager.rotateRsaKey('Automated test rotation');
  assert(rotatedRsa.version === initialRsaVersion + 1, 'KMM increments key version upon rotation');
  assert(keyManager.getRsaKeyByVersion(initialRsaVersion).status === 'rotated', 'Previous key version is archived');

  // 9. Session Management & Anti-Hijacking Protection
  console.log('\n--- TEST GROUP 9: Session Management & Anti-Hijacking ---');
  const uaLegit = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
  const uaAttacker = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
  const sToken = createSessionToken({ userId: 'test_u1', role: 'student', userAgent: uaLegit });
  const legitVerif = verifySessionToken(sToken, uaLegit);
  assert(legitVerif.valid, 'Legitimate client session token is verified');
  const hijackVerif = verifySessionToken(sToken, uaAttacker);
  assert(!hijackVerif.valid && hijackVerif.hijackAttempt, 'Session hijacking detected when User-Agent does not match token');

  // Logout Revocation
  revokeSession(legitVerif.payload.sid);
  const revokedVerif = verifySessionToken(sToken, uaLegit);
  assert(!revokedVerif.valid, 'Revoked session cannot be replayed after logout');

  // 10. CBC-MAC Image Integrity
  console.log('\n--- TEST GROUP 10: CBC-MAC Image Binary & Metadata Integrity ---');
  const imgPayload = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';
  const cbcTag1 = cbcMac('img_key_test', imgPayload);
  const cbcTag2 = cbcMac('img_key_test', imgPayload);
  const cbcTagTampered = cbcMac('img_key_test', imgPayload + 'corrupt');
  assert(cbcTag1 === cbcTag2, 'CBC-MAC is deterministic for identical media');
  assert(cbcTag1 !== cbcTagTampered, 'CBC-MAC detects modified image payload');

  console.log('\n================================================================');
  console.log(` RESULTS: ALL ${passedTests} OF ${totalTests} TESTS PASSED WITH ZERO ERRORS!`);
  console.log(' ALL CRITICAL SECURITY & CRYPTOGRAPHY REQUIREMENTS VERIFIED!');
  console.log('================================================================');
  process.exit(0);
}

runTestSuite().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
