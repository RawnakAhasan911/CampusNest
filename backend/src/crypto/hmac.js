/**
 * Pure From-Scratch HMAC-SHA256 and CBC-MAC Implementations
 * Complies with RFC 2104. Absolutely NO node:crypto or external libraries.
 */

const { sha256Bytes, sha256, stringToUtf8Bytes } = require('./sha256');

/**
 * Normalizes input (string, buffer, uint8array) into Uint8Array.
 */
function toBytes(data) {
  if (typeof data === 'string') {
    return stringToUtf8Bytes(data);
  }
  if (data instanceof Uint8Array) {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }
  return stringToUtf8Bytes(String(data));
}

/**
 * Computes HMAC-SHA256 (RFC 2104) returning 32-byte Uint8Array.
 *
 * @param {Uint8Array|Buffer|string} key
 * @param {Uint8Array|Buffer|string} message
 * @returns {Uint8Array}
 */
function hmacSha256Bytes(key, message) {
  const keyBytes = toBytes(key);
  const msgBytes = toBytes(message);

  const blockSize = 64; // SHA-256 block size in bytes
  const kPadded = new Uint8Array(blockSize);

  if (keyBytes.length > blockSize) {
    const keyHash = sha256Bytes(keyBytes);
    kPadded.set(keyHash, 0);
  } else {
    kPadded.set(keyBytes, 0);
  }

  // ipad = 0x36, opad = 0x5c
  const innerPad = new Uint8Array(blockSize);
  const outerPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    innerPad[i] = kPadded[i] ^ 0x36;
    outerPad[i] = kPadded[i] ^ 0x5c;
  }

  // Inner hash: H(innerPad || message)
  const innerMsg = new Uint8Array(blockSize + msgBytes.length);
  innerMsg.set(innerPad, 0);
  innerMsg.set(msgBytes, blockSize);
  const innerHash = sha256Bytes(innerMsg);

  // Outer hash: H(outerPad || innerHash)
  const outerMsg = new Uint8Array(blockSize + 32);
  outerMsg.set(outerPad, 0);
  outerMsg.set(innerHash, blockSize);

  return sha256Bytes(outerMsg);
}

/**
 * Computes HMAC-SHA256 returning 64-char lowercase hex string.
 *
 * @param {Uint8Array|Buffer|string} key
 * @param {Uint8Array|Buffer|string} message
 * @returns {string}
 */
function hmacSha256(key, message) {
  const bytes = hmacSha256Bytes(key, message);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i].toString(16);
    hex += b.length === 1 ? '0' + b : b;
  }
  return hex;
}

/**
 * Constant-time comparison between two strings to prevent timing side-channel attacks.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean} True if strings are identical
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies HMAC-SHA256 against expected tag.
 *
 * @param {string|Uint8Array} key
 * @param {string|Uint8Array} message
 * @param {string} expectedMac
 * @returns {boolean}
 */
function verifyHmac(key, message, expectedMac) {
  const computed = hmacSha256(key, message);
  return timingSafeEqual(computed, expectedMac);
}

/**
 * Pure block CBC-MAC implementation.
 * Encrypts/hashes blocks sequentially in CBC mode and returns the final authentication block.
 *
 * @param {Uint8Array|string} key
 * @param {Uint8Array|string} message
 * @returns {string} 32-char hex MAC
 */
function cbcMac(key, message) {
  const keyBytes = sha256Bytes(toBytes(key));
  const msgBytes = toBytes(message);
  const blockSize = 16;

  // PKCS#7-like padding
  const padLen = blockSize - (msgBytes.length % blockSize);
  const totalLen = msgBytes.length + padLen;
  const padded = new Uint8Array(totalLen);
  padded.set(msgBytes, 0);
  for (let i = msgBytes.length; i < totalLen; i++) {
    padded[i] = padLen;
  }

  // Running block initialized to IV = 0
  let currentBlock = new Uint8Array(blockSize);

  for (let offset = 0; offset < totalLen; offset += blockSize) {
    // XOR with plaintext block
    for (let i = 0; i < blockSize; i++) {
      currentBlock[i] ^= padded[offset + i];
    }
    // Block transformation using keyed SHA-256 compression
    const inputToHash = new Uint8Array(blockSize + keyBytes.length);
    inputToHash.set(currentBlock, 0);
    inputToHash.set(keyBytes, blockSize);
    const hash = sha256Bytes(inputToHash);
    currentBlock = hash.subarray(0, blockSize);
  }

  let hex = '';
  for (let i = 0; i < blockSize; i++) {
    const b = currentBlock[i].toString(16);
    hex += b.length === 1 ? '0' + b : b;
  }
  return hex;
}

/**
 * Generates an integrity verification payload.
 */
function signPayload(key, payload) {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const mac = hmacSha256(key, serialized);
  return { payload, mac };
}

/**
 * Verifies an integrity verification payload.
 */
function verifyPayload(key, payload, mac) {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return verifyHmac(key, serialized, mac);
}

module.exports = {
  hmacSha256,
  hmacSha256Bytes,
  timingSafeEqual,
  verifyHmac,
  cbcMac,
  signPayload,
  verifyPayload,
};
