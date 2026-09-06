/**
 * Pure From-Scratch Password Hashing (PBKDF2-HMAC-SHA256)
 * Follows RFC 2898 / RFC 8018 specifications.
 * Absolutely NO node:crypto or external packages.
 */

const { hmacSha256Bytes, timingSafeEqual } = require('./hmac');
const { randomHex } = require('./prng');
const { stringToUtf8Bytes } = require('./sha256');

/**
 * Derives a key using PBKDF2 with HMAC-SHA256.
 *
 * @param {string} password
 * @param {string|Uint8Array} salt
 * @param {number} iterations
 * @param {number} [keyLen=32]
 * @returns {string} Hex-encoded derived key
 */
function pbkdf2Sha256(password, salt, iterations = 2048, keyLen = 32) {
  const pwdBytes = stringToUtf8Bytes(password);
  const saltBytes = typeof salt === 'string' ? stringToUtf8Bytes(salt) : salt;

  const hLen = 32; // HMAC-SHA256 output length
  const numBlocks = Math.ceil(keyLen / hLen);
  const derivedKey = new Uint8Array(keyLen);

  for (let blockIndex = 1; blockIndex <= numBlocks; blockIndex++) {
    // Salt || INT_32_BE(blockIndex)
    const saltWithBlock = new Uint8Array(saltBytes.length + 4);
    saltWithBlock.set(saltBytes, 0);
    saltWithBlock[saltBytes.length] = (blockIndex >>> 24) & 0xff;
    saltWithBlock[saltBytes.length + 1] = (blockIndex >>> 16) & 0xff;
    saltWithBlock[saltBytes.length + 2] = (blockIndex >>> 8) & 0xff;
    saltWithBlock[saltBytes.length + 3] = blockIndex & 0xff;

    // U_1 = PRF(P, S || INT_32_BE(i))
    let uPrev = hmacSha256Bytes(pwdBytes, saltWithBlock);
    const blockXor = new Uint8Array(uPrev);

    // Iterations: U_2 ... U_c
    for (let iter = 1; iter < iterations; iter++) {
      uPrev = hmacSha256Bytes(pwdBytes, uPrev);
      for (let k = 0; k < hLen; k++) {
        blockXor[k] ^= uPrev[k];
      }
    }

    const destOffset = (blockIndex - 1) * hLen;
    const copyLen = Math.min(hLen, keyLen - destOffset);
    derivedKey.set(blockXor.subarray(0, copyLen), destOffset);
  }

  let hex = '';
  for (let i = 0; i < derivedKey.length; i++) {
    const b = derivedKey[i].toString(16);
    hex += b.length === 1 ? '0' + b : b;
  }
  return hex;
}

/**
 * Hashes a plaintext password with a random salt.
 *
 * @param {string} password
 * @param {string} [customSalt]
 * @param {number} [iterations=2048]
 * @returns {{ salt: string, iterations: number, hash: string, formatted: string }}
 */
function hashPassword(password, customSalt = null, iterations = 2048) {
  const salt = customSalt || randomHex(16);
  const hash = pbkdf2Sha256(password, salt, iterations, 32);
  const formatted = `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
  return {
    salt,
    iterations,
    hash,
    formatted,
  };
}

/**
 * Verifies a candidate password against a stored formatted hash string.
 *
 * @param {string} candidatePassword
 * @param {string} storedFormattedHash
 * @returns {boolean} True if password matches
 */
function verifyPassword(candidatePassword, storedFormattedHash) {
  if (!storedFormattedHash || typeof storedFormattedHash !== 'string') {
    return false;
  }
  const parts = storedFormattedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expectedHash = parts[3];

  if (isNaN(iterations) || !salt || !expectedHash) {
    return false;
  }

  const computedHash = pbkdf2Sha256(candidatePassword, salt, iterations, 32);
  return timingSafeEqual(computedHash, expectedHash);
}

module.exports = {
  pbkdf2Sha256,
  hashPassword,
  verifyPassword,
};
