/**
 * Pure From-Scratch Elliptic Curve Cryptography (ECC) - Algorithm 2
 * Curve: secp256k1 (Weierstrass form: y^2 = x^3 + 7 over F_p)
 * Implements Point Addition, Doubling, Scalar Multiplication,
 * Key Generation, and Asymmetric EC-ElGamal Encryption/Decryption.
 * Absolutely NO external libraries used.
 */

const { modInverse, fromHex, toHex } = require('./bigIntUtils');
const { randomBigInt } = require('./prng');
const { sha256Bytes, sha256, stringToUtf8Bytes } = require('./sha256');
const { hmacSha256 } = require('./hmac');

// secp256k1 Curve Parameters
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const A = 0n;
const B = 7n;
const Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;
const N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;

class ECPoint {
  constructor(x, y, isInfinity = false) {
    this.x = x ? ((x % P) + P) % P : 0n;
    this.y = y ? ((y % P) + P) % P : 0n;
    this.isInfinity = isInfinity;
  }

  static infinity() {
    return new ECPoint(0n, 0n, true);
  }

  isOnCurve() {
    if (this.isInfinity) return true;
    const left = (this.y * this.y) % P;
    const right = ((this.x * this.x * this.x) + (A * this.x) + B) % P;
    return left === right;
  }

  equals(other) {
    if (this.isInfinity && other.isInfinity) return true;
    if (this.isInfinity || other.isInfinity) return false;
    return this.x === other.x && this.y === other.y;
  }
}

const G = new ECPoint(Gx, Gy);

/**
 * Elliptic curve point addition: P1 + P2 mod P
 */
function pointAdd(P1, P2) {
  if (P1.isInfinity) return P2;
  if (P2.isInfinity) return P1;

  // If x1 == x2 and y1 == -y2 mod P, sum is point at infinity
  if (P1.x === P2.x && (P1.y !== P2.y || P1.y === 0n)) {
    return ECPoint.infinity();
  }

  // If points are identical, perform point doubling
  if (P1.x === P2.x && P1.y === P2.y) {
    return pointDouble(P1);
  }

  // Slope lambda = (y2 - y1) / (x2 - x1) mod P
  const dy = ((P2.y - P1.y) % P + P) % P;
  const dx = ((P2.x - P1.x) % P + P) % P;
  const lambda = (dy * modInverse(dx, P)) % P;

  // x3 = lambda^2 - x1 - x2 mod P
  const x3 = ((lambda * lambda - P1.x - P2.x) % P + P) % P;
  // y3 = lambda * (x1 - x3) - y1 mod P
  const y3 = ((lambda * (P1.x - x3) - P1.y) % P + P) % P;

  return new ECPoint(x3, y3);
}

/**
 * Elliptic curve point doubling: 2 * P mod P
 */
function pointDouble(P1) {
  if (P1.isInfinity || P1.y === 0n) {
    return ECPoint.infinity();
  }

  // Slope lambda = (3 * x1^2 + a) / (2 * y1) mod P
  const num = ((3n * P1.x * P1.x + A) % P + P) % P;
  const den = ((2n * P1.y) % P + P) % P;
  const lambda = (num * modInverse(den, P)) % P;

  // x3 = lambda^2 - 2 * x1 mod P
  const x3 = ((lambda * lambda - 2n * P1.x) % P + P) % P;
  // y3 = lambda * (x1 - x3) - y1 mod P
  const y3 = ((lambda * (P1.x - x3) - P1.y) % P + P) % P;

  return new ECPoint(x3, y3);
}

/**
 * Elliptic curve scalar multiplication: k * P mod P using Double-and-Add
 */
function scalarMultiply(k, P1) {
  let scalar = ((k % N) + N) % N;
  if (scalar === 0n || P1.isInfinity) {
    return ECPoint.infinity();
  }

  let result = ECPoint.infinity();
  let addend = P1;

  while (scalar > 0n) {
    if (scalar & 1n) {
      result = pointAdd(result, addend);
    }
    addend = pointDouble(addend);
    scalar >>= 1n;
  }

  return result;
}

/**
 * Generates an ECC Key Pair on secp256k1.
 *
 * @returns {{ privateKey: string, publicKey: { x: string, y: string } }}
 */
function generateEccKeyPair() {
  const privateScalar = randomBigInt(1n, N - 1n);
  const publicPoint = scalarMultiply(privateScalar, G);

  return {
    privateKey: privateScalar.toString(16),
    publicKey: {
      x: publicPoint.x.toString(16),
      y: publicPoint.y.toString(16),
    },
  };
}

/**
 * Pure Asymmetric EC-ElGamal Encryption.
 * Encrypts a message using recipient's ECC public key.
 *
 * @param {string|object} data
 * @param {{ x: string, y: string }} recipientPublicKey
 * @param {string} [hmacKey]
 * @returns {{ C1: { x: string, y: string }, C2: string, mac: string, algorithm: string }}
 */
function eccEncrypt(data, recipientPublicKey, hmacKey = 'system_ecc_integrity_secret') {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const dataBytes = stringToUtf8Bytes(text);

  const Q = new ECPoint(fromHex(recipientPublicKey.x), fromHex(recipientPublicKey.y));
  if (!Q.isOnCurve() || Q.isInfinity) {
    throw new Error('Invalid ECC public key: point is not on curve');
  }

  // 1. Generate ephemeral scalar k in [1, N-1]
  const k = randomBigInt(1n, N - 1n);

  // 2. Ephemeral point C1 = k * G
  const C1 = scalarMultiply(k, G);

  // 3. Shared secret point S = k * Q
  const S = scalarMultiply(k, Q);

  // 4. Derive mask using custom SHA-256 over S.x and S.y
  const sxBytes = stringToUtf8Bytes(toHex(S.x, 32));
  const syBytes = stringToUtf8Bytes(toHex(S.y, 32));
  const sCombined = new Uint8Array(sxBytes.length + syBytes.length);
  sCombined.set(sxBytes, 0);
  sCombined.set(syBytes, sxBytes.length);

  // Generate stream mask for data bytes
  const maskedBytes = new Uint8Array(dataBytes.length);
  let chunkIndex = 0;
  let offset = 0;

  while (offset < dataBytes.length) {
    const idxBytes = stringToUtf8Bytes(chunkIndex.toString(16));
    const toHash = new Uint8Array(sCombined.length + idxBytes.length);
    toHash.set(sCombined, 0);
    toHash.set(idxBytes, sCombined.length);

    const keyBlock = sha256Bytes(toHash);
    const take = Math.min(keyBlock.length, dataBytes.length - offset);

    for (let i = 0; i < take; i++) {
      maskedBytes[offset + i] = dataBytes[offset + i] ^ keyBlock[i];
    }

    offset += take;
    chunkIndex++;
  }

  let c2Hex = '';
  for (let i = 0; i < maskedBytes.length; i++) {
    const b = maskedBytes[i].toString(16);
    c2Hex += b.length === 1 ? '0' + b : b;
  }

  const payloadToMac = `${C1.x.toString(16)}:${C1.y.toString(16)}:${c2Hex}`;
  const mac = hmacSha256(hmacKey, payloadToMac);

  return {
    C1: {
      x: C1.x.toString(16),
      y: C1.y.toString(16),
    },
    C2: c2Hex,
    mac,
    algorithm: 'ECC-ELGAMAL-SECP256K1',
  };
}

/**
 * Pure Asymmetric EC-ElGamal Decryption.
 * Decrypts ciphertext using recipient's ECC private key.
 *
 * @param {{ C1: { x: string, y: string }, C2: string, mac?: string }} encryptedPackage
 * @param {string} recipientPrivateKeyHex
 * @param {string} [hmacKey]
 * @returns {string} Plaintext UTF-8 string
 */
function eccDecrypt(encryptedPackage, recipientPrivateKeyHex, hmacKey = 'system_ecc_integrity_secret') {
  if (!encryptedPackage || !encryptedPackage.C1 || !encryptedPackage.C2) {
    throw new Error('Invalid ECC encrypted package format');
  }

  // Verify MAC integrity
  if (encryptedPackage.mac && hmacKey) {
    const payloadToMac = `${encryptedPackage.C1.x}:${encryptedPackage.C1.y}:${encryptedPackage.C2}`;
    const computedMac = hmacSha256(hmacKey, payloadToMac);
    if (computedMac !== encryptedPackage.mac) {
      throw new Error('Cryptographic Integrity Check Failed: ECC ciphertext tampered!');
    }
  }

  const C1 = new ECPoint(fromHex(encryptedPackage.C1.x), fromHex(encryptedPackage.C1.y));
  if (!C1.isOnCurve() || C1.isInfinity) {
    throw new Error('Invalid ephemeral curve point in ciphertext');
  }

  const d = fromHex(recipientPrivateKeyHex);

  // Compute shared secret point S = d * C1 = d * (k * G) = k * (d * G) = k * Q
  const S = scalarMultiply(d, C1);

  // Derive identical mask
  const sxBytes = stringToUtf8Bytes(toHex(S.x, 32));
  const syBytes = stringToUtf8Bytes(toHex(S.y, 32));
  const sCombined = new Uint8Array(sxBytes.length + syBytes.length);
  sCombined.set(sxBytes, 0);
  sCombined.set(syBytes, sxBytes.length);

  // Parse C2 bytes
  const c2Hex = encryptedPackage.C2;
  const cipherBytes = new Uint8Array(c2Hex.length / 2);
  for (let i = 0; i < cipherBytes.length; i++) {
    cipherBytes[i] = parseInt(c2Hex.substring(i * 2, i * 2 + 2), 16);
  }

  const plainBytes = new Uint8Array(cipherBytes.length);
  let chunkIndex = 0;
  let offset = 0;

  while (offset < cipherBytes.length) {
    const idxBytes = stringToUtf8Bytes(chunkIndex.toString(16));
    const toHash = new Uint8Array(sCombined.length + idxBytes.length);
    toHash.set(sCombined, 0);
    toHash.set(idxBytes, sCombined.length);

    const keyBlock = sha256Bytes(toHash);
    const take = Math.min(keyBlock.length, cipherBytes.length - offset);

    for (let i = 0; i < take; i++) {
      plainBytes[offset + i] = cipherBytes[offset + i] ^ keyBlock[i];
    }

    offset += take;
    chunkIndex++;
  }

  return Buffer.from(plainBytes).toString('utf8');
}

module.exports = {
  ECPoint,
  G,
  N,
  P,
  pointAdd,
  pointDouble,
  scalarMultiply,
  generateEccKeyPair,
  eccEncrypt,
  eccDecrypt,
};
