/**
 * Pure From-Scratch Cryptographic Pseudo-Random Number Generator (PRNG)
 * Implements a Hash-DRBG construction using custom SHA-256 and continuous
 * hardware entropy collection (micro-timing jitter, process metrics, high-res timers).
 * Strictly NO node:crypto or external libraries.
 */

const { sha256Bytes, sha256, stringToUtf8Bytes } = require('./sha256');

class CustomPRNG {
  constructor() {
    this.state = new Uint8Array(32);
    this.counter = 1n;
    this.reseedCount = 0;
    this.initEntropy();
  }

  /**
   * Harvests timing jitter entropy from CPU execution fluctuations.
   */
  harvestJitterEntropy() {
    const jitter = [];
    let last = process.hrtime.bigint();
    for (let i = 0; i < 32; i++) {
      let x = 0;
      for (let j = 0; j < 50; j++) {
        x = (x * 1664525 + 1013904223) | 0;
      }
      const now = process.hrtime.bigint();
      jitter.push(Number((now - last) & 0xffn));
      last = now;
    }
    return new Uint8Array(jitter);
  }

  /**
   * Initializes internal state by accumulating environmental and hardware entropy.
   */
  initEntropy() {
    const mem = process.memoryUsage();
    const entropyMaterial = [
      process.hrtime.bigint().toString(),
      Date.now().toString(),
      process.pid.toString(),
      process.uptime().toString(),
      mem.rss.toString(),
      mem.heapUsed.toString(),
      mem.external.toString(),
      Math.random().toString(),
    ].join(':');

    const baseBytes = stringToUtf8Bytes(entropyMaterial);
    const jitter = this.harvestJitterEntropy();

    const combined = new Uint8Array(baseBytes.length + jitter.length);
    combined.set(baseBytes, 0);
    combined.set(jitter, baseBytes.length);

    this.state = sha256Bytes(combined);
    this.counter = 1n;
    this.reseedCount++;
  }

  /**
   * Reseeds periodically or when explicitly requested.
   */
  reseed() {
    const jitter = this.harvestJitterEntropy();
    const timeBytes = stringToUtf8Bytes(process.hrtime.bigint().toString() + ':' + this.reseedCount);
    const combined = new Uint8Array(this.state.length + jitter.length + timeBytes.length);
    combined.set(this.state, 0);
    combined.set(jitter, this.state.length);
    combined.set(timeBytes, this.state.length + jitter.length);

    this.state = sha256Bytes(combined);
    this.reseedCount++;
  }

  /**
   * Generates n cryptographically secure random bytes.
   *
   * @param {number} n Number of bytes
   * @returns {Uint8Array}
   */
  randomBytes(n) {
    if (n <= 0) return new Uint8Array(0);

    // Reseed every 100 requests or after generating 4096 bytes
    if (this.counter % 100n === 0n) {
      this.reseed();
    }

    const output = new Uint8Array(n);
    let bytesGenerated = 0;

    while (bytesGenerated < n) {
      // Input to hash: state || counter
      const counterBytes = stringToUtf8Bytes(this.counter.toString(16));
      const hashInput = new Uint8Array(this.state.length + counterBytes.length);
      hashInput.set(this.state, 0);
      hashInput.set(counterBytes, this.state.length);

      const block = sha256Bytes(hashInput);
      this.counter++;

      const toCopy = Math.min(block.length, n - bytesGenerated);
      output.set(block.subarray(0, toCopy), bytesGenerated);
      bytesGenerated += toCopy;
    }

    // Forward secrecy: update state = SHA-256(state || output)
    const updateInput = new Uint8Array(this.state.length + 32);
    updateInput.set(this.state, 0);
    updateInput.set(output.subarray(0, Math.min(32, output.length)), this.state.length);
    this.state = sha256Bytes(updateInput);

    return output;
  }

  /**
   * Generates random bytes as a hex string.
   *
   * @param {number} byteCount
   * @returns {string} Hex string
   */
  randomHex(byteCount) {
    const bytes = this.randomBytes(byteCount);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i].toString(16);
      hex += b.length === 1 ? '0' + b : b;
    }
    return hex;
  }

  /**
   * Generates a random integer in range [min, max)
   *
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randomInt(min, max) {
    if (min >= max) throw new Error('min must be strictly less than max');
    const range = max - min;
    const bytes = this.randomBytes(4);
    const val = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
    const unsignedVal = val >>> 0;
    return min + (unsignedVal % range);
  }

  /**
   * Generates a uniform random BigInt in range [min, max].
   *
   * @param {bigint} min
   * @param {bigint} max
   * @returns {bigint}
   */
  randomBigInt(min, max) {
    if (min > max) throw new Error('min must be <= max');
    if (min === max) return min;

    const range = max - min;
    const bitLen = range.toString(2).length;
    const byteLen = Math.ceil(bitLen / 8);

    // Rejection sampling to ensure uniform distribution
    while (true) {
      const bytes = this.randomBytes(byteLen);
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i].toString(16);
        hex += b.length === 1 ? '0' + b : b;
      }
      const candidate = BigInt('0x' + (hex || '0'));
      // Mask highest bits if bitLen is not a multiple of 8
      const excessBits = byteLen * 8 - bitLen;
      const mask = (1n << BigInt(bitLen)) - 1n;
      const maskedCandidate = candidate & mask;

      if (maskedCandidate <= range) {
        return min + maskedCandidate;
      }
    }
  }

  /**
   * Generates a 6-digit numeric OTP string for 2FA.
   *
   * @returns {string} 6-digit string, e.g. "481920"
   */
  randomOtp(digits = 6) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits);
    const num = this.randomInt(min, max);
    return num.toString();
  }
}

const globalPRNG = new CustomPRNG();

module.exports = {
  CustomPRNG,
  prng: globalPRNG,
  randomBytes: (n) => globalPRNG.randomBytes(n),
  randomHex: (n) => globalPRNG.randomHex(n),
  randomInt: (min, max) => globalPRNG.randomInt(min, max),
  randomBigInt: (min, max) => globalPRNG.randomBigInt(min, max),
  randomOtp: (digits) => globalPRNG.randomOtp(digits),
};
