/**
 * Unified Cryptographic Service
 * Coordinates custom RSA and ECC asymmetric encryption schemes,
 * HMAC/CBC-MAC integrity checking, and blind indexing.
 * Pure custom implementation without external crypto dependencies.
 */

const { rsaEncrypt, rsaDecrypt } = require('./rsa');
const { eccEncrypt, eccDecrypt } = require('./ecc');
const { sha256 } = require('./sha256');
const { hmacSha256, cbcMac, verifyHmac } = require('./hmac');
const { keyManager } = require('./keyManager');

// System Pepper for Blind Indexing (prevents rainbow table attacks on encrypted search fields)
const PEPPER = 'CSE447_SECURE_HOUSING_PEPPER_2026';

/**
 * Computes a deterministic blind index hash for unique lookups (e.g. Email)
 * without revealing the plaintext email in the database.
 */
function createBlindIndex(value, fieldName = 'email') {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase();
  return sha256(`${PEPPER}:${fieldName}:${normalized}`);
}

/**
 * Encrypts sensitive data using the active System RSA Asymmetric Key.
 *
 * @param {string|object} data Plaintext or object
 * @param {number} [targetVersion] Specific key version (defaults to active)
 * @returns {{ ciphertext: { blocks: string[], mac: string, algorithm: string }, keyVersion: number, algorithm: string }}
 */
function encryptDataRSA(data, targetVersion = null) {
  const activeKey = targetVersion ? keyManager.getRsaKeyByVersion(targetVersion) : keyManager.getActiveRsaKey();
  if (!activeKey) {
    throw new Error('No active RSA key available in Key Manager');
  }

  const hmacKey = `rsa_integrity_secret_v${activeKey.version}`;
  const encrypted = rsaEncrypt(data, activeKey.publicKey, hmacKey);

  return {
    blocks: encrypted.blocks,
    mac: encrypted.mac,
    keyVersion: activeKey.version,
    algorithm: encrypted.algorithm,
  };
}

/**
 * Decrypts RSA-encrypted data using the corresponding RSA private key.
 *
 * @param {{ blocks: string[], mac: string, keyVersion: number }} encryptedObj
 * @returns {any} Decrypted string or parsed JSON object
 */
function decryptDataRSA(encryptedObj) {
  if (!encryptedObj || !encryptedObj.blocks) {
    return null;
  }

  const version = encryptedObj.keyVersion || keyManager.activeRsaVersion;
  const keyEntry = keyManager.getRsaKeyByVersion(version);
  if (!keyEntry) {
    throw new Error(`RSA key version ${version} not found in Key Manager`);
  }

  const hmacKey = `rsa_integrity_secret_v${keyEntry.version}`;
  const plaintext = rsaDecrypt(encryptedObj, keyEntry.privateKey, hmacKey);

  const trimmed = plaintext.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(plaintext);
    } catch (e) {
      return plaintext;
    }
  }
  return plaintext;
}

/**
 * Encrypts private data using Recipient's ECC Public Key (EC-ElGamal).
 * Used for peer-to-peer student messages and 2FA OTP codes.
 *
 * @param {string|object} data
 * @param {{ x: string, y: string }} recipientPublicKey
 * @returns {{ C1: { x: string, y: string }, C2: string, mac: string, algorithm: string }}
 */
function encryptDataECC(data, recipientPublicKey) {
  if (!recipientPublicKey || !recipientPublicKey.x || !recipientPublicKey.y) {
    throw new Error('Invalid ECC public key provided for asymmetric encryption');
  }
  return eccEncrypt(data, recipientPublicKey);
}

/**
 * Decrypts ECC-encrypted data using Recipient's ECC Private Key.
 *
 * @param {{ C1: { x: string, y: string }, C2: string, mac?: string }} encryptedPackage
 * @param {string} recipientPrivateKeyHex
 * @returns {any} Decrypted string or parsed JSON
 */
function decryptDataECC(encryptedPackage, recipientPrivateKeyHex) {
  if (!encryptedPackage || !encryptedPackage.C1 || !encryptedPackage.C2) {
    return null;
  }
  const plaintext = eccDecrypt(encryptedPackage, recipientPrivateKeyHex);
  const trimmed = plaintext.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(plaintext);
    } catch (e) {
      return plaintext;
    }
  }
  return plaintext;
}

/**
 * Computes CBC-MAC over image content and metadata for tamper verification.
 *
 * @param {string} imageData Base64 or binary string
 * @param {object} metadata
 * @returns {string} CBC-MAC tag
 */
function computeImageIntegrity(imageData, metadata) {
  const metaString = JSON.stringify(metadata || {});
  const payload = `${metaString}:${imageData}`;
  return cbcMac('image_cbc_mac_secret_key', payload);
}

/**
 * Verifies CBC-MAC over image content and metadata.
 */
function verifyImageIntegrity(imageData, metadata, expectedMac) {
  const computed = computeImageIntegrity(imageData, metadata);
  return computed === expectedMac;
}

module.exports = {
  createBlindIndex,
  encryptDataRSA,
  decryptDataRSA,
  encryptDataECC,
  decryptDataECC,
  computeImageIntegrity,
  verifyImageIntegrity,
};
