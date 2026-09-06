/**
 * Pure From-Scratch RSA Asymmetric Cryptosystem (Algorithm 1)
 * Implements RSA key generation, PKCS#1 v1.5 padding, block encryption,
 * decryption, and cryptographic integrity MAC tags.
 * Absolutely NO node:crypto or external crypto libraries used.
 */

const { modPow, gcd, modInverse, bitLength, toBEBytes, toBigIntBE, toHex, fromHex } = require('./bigIntUtils');
const { generatePrime } = require('./primeUtils');
const { randomBytes } = require('./prng');
const { hmacSha256 } = require('./hmac');
const { stringToUtf8Bytes } = require('./sha256');

/**
 * Generates an RSA Key Pair.
 *
 * @param {number} [keyBitLength=512] Total modulus bit length
 * @returns {{ publicKey: { n: string, e: string }, privateKey: { n: string, d: string, p: string, q: string } }}
 */
function generateRsaKeyPair(keyBitLength = 512) {
  const primeBits = Math.floor(keyBitLength / 2);
  let p, q, n, phi;

  while (true) {
    p = generatePrime(primeBits);
    q = generatePrime(primeBits);
    if (p === q) continue;

    n = p * q;
    phi = (p - 1n) * (q - 1n);

    let e = 65537n;
    if (gcd(e, phi) === 1n) {
      const d = modInverse(e, phi);
      return {
        publicKey: {
          n: n.toString(16),
          e: e.toString(16),
        },
        privateKey: {
          n: n.toString(16),
          d: d.toString(16),
          p: p.toString(16),
          q: q.toString(16),
        },
      };
    }
  }
}

/**
 * Applies PKCS#1 v1.5 padding to a message chunk.
 * Structure: 0x00 || 0x02 || PS (non-zero random bytes) || 0x00 || Data
 */
function padPkcs1v15(chunkBytes, targetLength) {
  const psLength = targetLength - chunkBytes.length - 3;
  if (psLength < 8) {
    throw new Error('Message chunk too large for RSA key modulus');
  }

  const padded = new Uint8Array(targetLength);
  padded[0] = 0x00;
  padded[1] = 0x02;

  // Generate non-zero random padding string (PS)
  let filled = 0;
  while (filled < psLength) {
    const r = randomBytes(psLength - filled);
    for (let i = 0; i < r.length && filled < psLength; i++) {
      if (r[i] !== 0) {
        padded[2 + filled] = r[i];
        filled++;
      }
    }
  }

  padded[2 + psLength] = 0x00;
  padded.set(chunkBytes, 3 + psLength);

  return padded;
}

/**
 * Removes PKCS#1 v1.5 padding from a decrypted block.
 */
function unpadPkcs1v15(paddedBytes) {
  if (paddedBytes.length < 11 || paddedBytes[0] !== 0x00 || paddedBytes[1] !== 0x02) {
    throw new Error('Invalid RSA PKCS#1 v1.5 padding: header mismatch');
  }

  let separatorIndex = -1;
  for (let i = 2; i < paddedBytes.length; i++) {
    if (paddedBytes[i] === 0x00) {
      separatorIndex = i;
      break;
    }
  }

  if (separatorIndex === -1 || separatorIndex < 10) {
    throw new Error('Invalid RSA PKCS#1 v1.5 padding: missing delimiter');
  }

  return paddedBytes.subarray(separatorIndex + 1);
}

/**
 * Encrypts arbitrary text or JSON data using RSA public key.
 * Chunks long messages and encrypts each block with PKCS#1 v1.5 padding.
 *
 * @param {string|object} data Plaintext string or JSON-serializable object
 * @param {{ n: string, e: string }} publicKey
 * @param {string} [hmacKey] Key to produce integrity MAC
 * @returns {{ blocks: string[], algorithm: string, mac: string }}
 */
function rsaEncrypt(data, publicKey, hmacKey = 'system_rsa_integrity_secret') {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const dataBytes = stringToUtf8Bytes(text);

  const n = fromHex(publicKey.n);
  const e = fromHex(publicKey.e);
  const modByteLen = Math.ceil(bitLength(n) / 8);
  const maxChunkSize = modByteLen - 11; // 11 bytes reserved for PKCS#1 v1.5 header and PS

  const blocks = [];
  for (let offset = 0; offset < dataBytes.length; offset += maxChunkSize) {
    const chunk = dataBytes.subarray(offset, Math.min(dataBytes.length, offset + maxChunkSize));
    const padded = padPkcs1v15(chunk, modByteLen);
    const m = toBigIntBE(padded);
    const c = modPow(m, e, n);
    blocks.push(toHex(c, modByteLen));
  }

  const cipherPayload = JSON.stringify(blocks);
  const mac = hmacSha256(hmacKey, cipherPayload);

  return {
    blocks,
    mac,
    algorithm: 'RSA-PKCS1v15-CUSTOM',
  };
}

/**
 * Decrypts RSA ciphertext blocks using RSA private key and verifies integrity MAC.
 *
 * @param {{ blocks: string[], mac?: string, algorithm?: string }} encryptedPackage
 * @param {{ n: string, d: string }} privateKey
 * @param {string} [hmacKey]
 * @returns {string} Decrypted plaintext UTF-8 string
 */
function rsaDecrypt(encryptedPackage, privateKey, hmacKey = 'system_rsa_integrity_secret') {
  if (!encryptedPackage || !Array.isArray(encryptedPackage.blocks)) {
    throw new Error('Invalid encrypted package format');
  }

  // Integrity MAC verification if present
  if (encryptedPackage.mac && hmacKey) {
    const cipherPayload = JSON.stringify(encryptedPackage.blocks);
    const computedMac = hmacSha256(hmacKey, cipherPayload);
    if (computedMac !== encryptedPackage.mac) {
      throw new Error('Cryptographic Integrity Check Failed: RSA ciphertext tampered!');
    }
  }

  const n = fromHex(privateKey.n);
  const d = fromHex(privateKey.d);
  const modByteLen = Math.ceil(bitLength(n) / 8);

  const decryptedChunks = [];
  let totalBytes = 0;

  for (let i = 0; i < encryptedPackage.blocks.length; i++) {
    const c = fromHex(encryptedPackage.blocks[i]);
    const m = modPow(c, d, n);
    const paddedBytes = toBEBytes(m, modByteLen);
    const chunk = unpadPkcs1v15(paddedBytes);
    decryptedChunks.push(chunk);
    totalBytes += chunk.length;
  }

  // Reassemble plain bytes
  const fullBytes = new Uint8Array(totalBytes);
  let pos = 0;
  for (const chunk of decryptedChunks) {
    fullBytes.set(chunk, pos);
    pos += chunk.length;
  }

  // Decode UTF-8
  return Buffer.from(fullBytes).toString('utf8');
}

module.exports = {
  generateRsaKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  padPkcs1v15,
  unpadPkcs1v15,
};
