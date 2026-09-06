/**
 * Custom BigInt Mathematical Primitives
 * Implemented from scratch without any external cryptography libraries.
 * Provides modular arithmetic, extended GCD, modular inverse, and byte conversions.
 */

/**
 * Modular Exponentiation: calculates (base^exp) mod modulus
 * Implemented using binary exponentiation (Square-and-Multiply).
 *
 * @param {bigint} base
 * @param {bigint} exp
 * @param {bigint} mod
 * @returns {bigint} (base^exp) mod mod
 */
function modPow(base, exp, mod) {
  if (mod === 1n) return 0n;
  if (mod <= 0n) throw new Error('Modulus must be positive');

  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;

  if (e < 0n) {
    b = modInverse(b, mod);
    e = -e;
  }

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % mod;
    }
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

/**
 * Greatest Common Divisor (Euclidean algorithm)
 *
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint} gcd(a, b)
 */
function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

/**
 * Extended Euclidean Algorithm
 * Computes integers x and y such that a*x + b*y = gcd(a, b)
 *
 * @param {bigint} a
 * @param {bigint} b
 * @returns {{ gcd: bigint, x: bigint, y: bigint }}
 */
function extGCD(a, b) {
  let old_r = a, r = b;
  let old_s = 1n, s = 0n;
  let old_t = 0n, t = 1n;

  while (r !== 0n) {
    const quotient = old_r / r;

    let temp_r = r;
    r = old_r - quotient * temp_r;
    old_r = temp_r;

    let temp_s = s;
    s = old_s - quotient * temp_s;
    old_s = temp_s;

    let temp_t = t;
    t = old_t - quotient * temp_t;
    old_t = temp_t;
  }

  return { gcd: old_r, x: old_s, y: old_t };
}

/**
 * Modular Multiplicative Inverse
 * Computes x such that (a * x) mod m = 1
 *
 * @param {bigint} a
 * @param {bigint} m
 * @returns {bigint} Inverse of a modulo m
 */
function modInverse(a, m) {
  const { gcd: g, x } = extGCD(((a % m) + m) % m, m);
  if (g !== 1n) {
    throw new Error(`Modular inverse does not exist (gcd=${g})`);
  }
  return ((x % m) + m) % m;
}

/**
 * Calculates the bit length of a positive BigInt.
 *
 * @param {bigint} n
 * @returns {number} Number of bits
 */
function bitLength(n) {
  if (n === 0n) return 0;
  let val = n < 0n ? -n : n;
  let bits = 0;
  while (val > 0n) {
    bits += 32;
    val >>= 32n;
  }
  // Refine exact count
  val = n < 0n ? -n : n;
  return val.toString(2).length;
}

/**
 * Converts BigInt to big-endian byte array (Uint8Array).
 *
 * @param {bigint} bigInt
 * @param {number} [targetLength] Optional minimum byte length (zero-padded on left)
 * @returns {Uint8Array}
 */
function toBEBytes(bigInt, targetLength = 0) {
  if (bigInt === 0n) {
    return new Uint8Array(targetLength > 0 ? targetLength : 1);
  }

  let hex = bigInt.toString(16);
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }

  const byteCount = hex.length / 2;
  const outLength = Math.max(byteCount, targetLength);
  const bytes = new Uint8Array(outLength);
  const offset = outLength - byteCount;

  for (let i = 0; i < byteCount; i++) {
    bytes[offset + i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Converts big-endian byte array or Buffer to BigInt.
 *
 * @param {Uint8Array|Buffer|number[]} bytes
 * @returns {bigint}
 */
function toBigIntBE(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i].toString(16);
    hex += b.length === 1 ? '0' + b : b;
  }
  return hex.length === 0 ? 0n : BigInt('0x' + hex);
}

/**
 * Formats a BigInt into a hex string with optional fixed length (in bytes).
 *
 * @param {bigint} bigInt
 * @param {number} [byteLength]
 * @returns {string} Hex string
 */
function toHex(bigInt, byteLength = 0) {
  let hex = bigInt.toString(16);
  if (byteLength > 0) {
    const targetHexLen = byteLength * 2;
    while (hex.length < targetHexLen) {
      hex = '0' + hex;
    }
  }
  return hex;
}

/**
 * Parses hex string into BigInt.
 *
 * @param {string} hex
 * @returns {bigint}
 */
function fromHex(hex) {
  if (!hex || hex === '0') return 0n;
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return BigInt('0x' + cleanHex);
}

module.exports = {
  modPow,
  gcd,
  extGCD,
  modInverse,
  bitLength,
  toBEBytes,
  toBigIntBE,
  toHex,
  fromHex,
};
