/**
 * Key Management Module (KMM)
 * Handles key generation, distribution, storage, and rotation
 * for both RSA and ECC asymmetric cryptosystems.
 * Pure custom implementation without external crypto dependencies.
 */

const { generateRsaKeyPair } = require('./rsa');
const { generateEccKeyPair } = require('./ecc');
const { sha256 } = require('./sha256');
const { hmacSha256 } = require('./hmac');

class KeyManagementModule {
  constructor() {
    this.rsaKeys = new Map(); // version -> { version, publicKey, privateKey, status, createdAt, mac }
    this.eccKeys = new Map(); // version -> { version, publicKey, privateKey, status, createdAt, mac }
    this.activeRsaVersion = 1;
    this.activeEccVersion = 1;
    this.rotationHistory = [];
    this.storage = null;
  }

  /**
   * Initializes the Key Manager with initial active keys.
   */
  async init(storage = null) {
    this.storage = storage;

    // Load from storage if available
    if (this.storage && typeof this.storage.loadKeys === 'function') {
      const stored = await this.storage.loadKeys();
      if (stored && stored.rsaKeys && stored.rsaKeys.length > 0) {
        for (const k of stored.rsaKeys) {
          this.rsaKeys.set(k.version, k);
          if (k.status === 'active') this.activeRsaVersion = k.version;
        }
        for (const k of stored.eccKeys) {
          this.eccKeys.set(k.version, k);
          if (k.status === 'active') this.activeEccVersion = k.version;
        }
        if (stored.history) {
          this.rotationHistory = stored.history;
        }
        return;
      }
    }

    // Otherwise generate initial version 1 keys
    const rsaInitial = generateRsaKeyPair(256);
    const rsaFingerprint = sha256(rsaInitial.publicKey.n);
    const rsaEntry = {
      version: 1,
      algorithm: 'RSA-PKCS1v15-CUSTOM',
      keySize: 256,
      publicKey: rsaInitial.publicKey,
      privateKey: rsaInitial.privateKey,
      fingerprint: rsaFingerprint,
      status: 'active',
      createdAt: new Date().toISOString(),
      mac: hmacSha256('kmm_master_integrity_key', rsaFingerprint + ':1:active'),
    };
    this.rsaKeys.set(1, rsaEntry);
    this.activeRsaVersion = 1;

    const eccInitial = generateEccKeyPair();
    const eccFingerprint = sha256(eccInitial.publicKey.x + ':' + eccInitial.publicKey.y);
    const eccEntry = {
      version: 1,
      algorithm: 'ECC-ELGAMAL-SECP256K1',
      curve: 'secp256k1',
      publicKey: eccInitial.publicKey,
      privateKey: eccInitial.privateKey,
      fingerprint: eccFingerprint,
      status: 'active',
      createdAt: new Date().toISOString(),
      mac: hmacSha256('kmm_master_integrity_key', eccFingerprint + ':1:active'),
    };
    this.eccKeys.set(1, eccEntry);
    this.activeEccVersion = 1;

    this.rotationHistory.push({
      action: 'INITIAL_KEYGEN',
      timestamp: new Date().toISOString(),
      rsaVersion: 1,
      eccVersion: 1,
      description: 'Initial system RSA and ECC cryptographic keypairs generated',
    });

    await this.persist();
  }

  async persist() {
    if (this.storage && typeof this.storage.saveKeys === 'function') {
      const data = {
        rsaKeys: Array.from(this.rsaKeys.values()),
        eccKeys: Array.from(this.eccKeys.values()),
        history: this.rotationHistory,
      };
      await this.storage.saveKeys(data);
    }
  }

  /**
   * Retrieves active RSA key pair.
   */
  getActiveRsaKey() {
    return this.rsaKeys.get(this.activeRsaVersion);
  }

  /**
   * Retrieves specific RSA key by version.
   */
  getRsaKeyByVersion(version) {
    return this.rsaKeys.get(Number(version)) || this.getActiveRsaKey();
  }

  /**
   * Retrieves active system ECC key pair.
   */
  getActiveEccKey() {
    return this.eccKeys.get(this.activeEccVersion);
  }

  /**
   * Retrieves specific system ECC key by version.
   */
  getEccKeyByVersion(version) {
    return this.eccKeys.get(Number(version)) || this.getActiveEccKey();
  }

  /**
   * Generates a new user-specific ECC key pair for peer-to-peer secure messaging.
   */
  generateUserEccKeyPair() {
    const keyPair = generateEccKeyPair();
    const fingerprint = sha256(keyPair.publicKey.x + ':' + keyPair.publicKey.y);
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      fingerprint,
      createdAt: new Date().toISOString(),
      algorithm: 'ECC-ELGAMAL-SECP256K1',
    };
  }

  /**
   * Performs cryptographic key rotation for system RSA keys.
   */
  async rotateRsaKey(reason = 'Scheduled Security Rotation') {
    const oldKey = this.getActiveRsaKey();
    if (oldKey) {
      oldKey.status = 'rotated';
      oldKey.rotatedAt = new Date().toISOString();
    }

    const newVersion = this.activeRsaVersion + 1;
    const newPair = generateRsaKeyPair(256);
    const fingerprint = sha256(newPair.publicKey.n);

    const newEntry = {
      version: newVersion,
      algorithm: 'RSA-PKCS1v15-CUSTOM',
      keySize: 256,
      publicKey: newPair.publicKey,
      privateKey: newPair.privateKey,
      fingerprint,
      status: 'active',
      createdAt: new Date().toISOString(),
      mac: hmacSha256('kmm_master_integrity_key', fingerprint + `:${newVersion}:active`),
    };

    this.rsaKeys.set(newVersion, newEntry);
    this.activeRsaVersion = newVersion;

    this.rotationHistory.push({
      action: 'RSA_ROTATION',
      previousVersion: newVersion - 1,
      newVersion,
      timestamp: new Date().toISOString(),
      reason,
      fingerprint,
    });

    await this.persist();
    return newEntry;
  }

  /**
   * Performs cryptographic key rotation for system ECC keys.
   */
  async rotateEccKey(reason = 'Scheduled Security Rotation') {
    const oldKey = this.getActiveEccKey();
    if (oldKey) {
      oldKey.status = 'rotated';
      oldKey.rotatedAt = new Date().toISOString();
    }

    const newVersion = this.activeEccVersion + 1;
    const newPair = generateEccKeyPair();
    const fingerprint = sha256(newPair.publicKey.x + ':' + newPair.publicKey.y);

    const newEntry = {
      version: newVersion,
      algorithm: 'ECC-ELGAMAL-SECP256K1',
      curve: 'secp256k1',
      publicKey: newPair.publicKey,
      privateKey: newPair.privateKey,
      fingerprint,
      status: 'active',
      createdAt: new Date().toISOString(),
      mac: hmacSha256('kmm_master_integrity_key', fingerprint + `:${newVersion}:active`),
    };

    this.eccKeys.set(newVersion, newEntry);
    this.activeEccVersion = newVersion;

    this.rotationHistory.push({
      action: 'ECC_ROTATION',
      previousVersion: newVersion - 1,
      newVersion,
      timestamp: new Date().toISOString(),
      reason,
      fingerprint,
    });

    await this.persist();
    return newEntry;
  }

  /**
   * Returns public key metadata (safe for distribution, no private keys).
   */
  getPublicRegistry() {
    const rsaPublicList = Array.from(this.rsaKeys.values()).map(k => ({
      version: k.version,
      algorithm: k.algorithm,
      keySize: k.keySize,
      fingerprint: k.fingerprint,
      status: k.status,
      createdAt: k.createdAt,
      publicKey: k.publicKey,
    }));

    const eccPublicList = Array.from(this.eccKeys.values()).map(k => ({
      version: k.version,
      algorithm: k.algorithm,
      curve: k.curve,
      fingerprint: k.fingerprint,
      status: k.status,
      createdAt: k.createdAt,
      publicKey: k.publicKey,
    }));

    return {
      activeRsaVersion: this.activeRsaVersion,
      activeEccVersion: this.activeEccVersion,
      rsaKeys: rsaPublicList,
      eccKeys: eccPublicList,
      rotationHistory: this.rotationHistory,
    };
  }
}

const keyManager = new KeyManagementModule();

module.exports = {
  KeyManagementModule,
  keyManager,
};
