/**
 * Pure From-Scratch SHA-256 Implementation (FIPS 180-4)
 * Absolutely NO node:crypto or external libraries used.
 */

// Initial Hash Values (First 32 bits of the fractional parts of square roots of the first 8 primes)
const H_INIT = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// Round Constants (First 32 bits of fractional parts of cube roots of the first 64 primes)
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/**
 * 32-bit Right Rotation
 */
function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function ch(x, y, z) {
  return ((x & y) ^ (~x & z)) >>> 0;
}

function maj(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z)) >>> 0;
}

function sigma0(x) {
  return (rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)) >>> 0;
}

function sigma1(x) {
  return (rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)) >>> 0;
}

function gamma0(x) {
  return (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
}

function gamma1(x) {
  return (rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)) >>> 0;
}

/**
 * Converts UTF-8 string to Uint8Array.
 */
function stringToUtf8Bytes(str) {
  if (typeof str !== 'string') {
    str = String(str);
  }
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let codePoint = str.charCodeAt(i);
    if (codePoint >= 0xD800 && codePoint <= 0xDBFF && i + 1 < str.length) {
      const second = str.charCodeAt(i + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        codePoint = (codePoint - 0xD800) * 0x400 + (second - 0xDC00) + 0x10000;
        i++;
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xC0 | (codePoint >> 6));
      bytes.push(0x80 | (codePoint & 0x3F));
    } else if (codePoint < 0x10000) {
      bytes.push(0xE0 | (codePoint >> 12));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
      bytes.push(0x80 | (codePoint & 0x3F));
    } else {
      bytes.push(0xF0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3F));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
      bytes.push(0x80 | (codePoint & 0x3F));
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Computes SHA-256 hash returning 32-byte Uint8Array.
 *
 * @param {Uint8Array|Buffer|string} input
 * @returns {Uint8Array} 32-byte digest
 */
function sha256Bytes(input) {
  let msgBytes;
  if (typeof input === 'string') {
    msgBytes = stringToUtf8Bytes(input);
  } else if (input instanceof Uint8Array || Buffer.isBuffer(input)) {
    msgBytes = input;
  } else {
    msgBytes = stringToUtf8Bytes(String(input));
  }

  const originalByteLen = msgBytes.length;
  // Padding: length + 1 (for 0x80) + k zeros + 8 (length in bits) = multiple of 64
  let paddedLen = originalByteLen + 1 + 8;
  const rem = paddedLen % 64;
  if (rem !== 0) {
    paddedLen += (64 - rem);
  }

  const buffer = new Uint8Array(paddedLen);
  buffer.set(msgBytes, 0);
  buffer[originalByteLen] = 0x80;

  // Append original message length in bits (64-bit big endian integer)
  const bitLen = BigInt(originalByteLen) * 8n;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  view.setBigUint64(paddedLen - 8, bitLen, false);

  // Initialize working variables
  let [h0, h1, h2, h3, h4, h5, h6, h7] = H_INIT;

  const w = new Uint32Array(64);

  // Process 512-bit (64-byte) blocks
  for (let offset = 0; offset < paddedLen; offset += 64) {
    // 1. Prepare message schedule W[0..15]
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }

    // 2. Extend to W[16..63]
    for (let i = 16; i < 64; i++) {
      const s0 = gamma0(w[i - 15]);
      const s1 = gamma1(w[i - 2]);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    // 3. Initialize working variables
    let a = h0, b = h1, c = h2, d = h3;
    let e = h4, f = h5, g = h6, h = h7;

    // 4. Main compression loop
    for (let i = 0; i < 64; i++) {
      const t1 = (h + sigma1(e) + ch(e, f, g) + K[i] + w[i]) >>> 0;
      const t2 = (sigma0(a) + maj(a, b, c)) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    // 5. Add compressed chunk to current hash value
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  // Produce final 32-byte digest
  const digest = new Uint8Array(32);
  const outView = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);

  return digest;
}

/**
 * Computes SHA-256 and returns a 64-character hex string.
 *
 * @param {Uint8Array|Buffer|string} input
 * @returns {string} Lowercase hex string
 */
function sha256(input) {
  const bytes = sha256Bytes(input);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i].toString(16);
    hex += b.length === 1 ? '0' + b : b;
  }
  return hex;
}

module.exports = {
  sha256,
  sha256Bytes,
  stringToUtf8Bytes,
};
