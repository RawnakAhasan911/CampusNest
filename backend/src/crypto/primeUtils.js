/**
 * Pure From-Scratch Primality Testing and Prime Generation
 * Implements Miller-Rabin probabilistic primality testing with small-prime pre-sieving.
 * Absolutely NO external libraries.
 */

const { modPow } = require('./bigIntUtils');
const { randomBigInt } = require('./prng');

// First 70 small primes for rapid trial division pre-screening
const SMALL_PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173,
  179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281,
  283, 293, 307, 311, 313, 317, 331, 337, 347, 349
];

/**
 * Rapid trial division against small primes.
 * Returns false if candidate is composite.
 */
function passesSmallPrimes(n) {
  for (let i = 0; i < SMALL_PRIMES.length; i++) {
    const p = BigInt(SMALL_PRIMES[i]);
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  return true;
}

/**
 * Miller-Rabin Probabilistic Primality Test.
 *
 * @param {bigint} n Candidate odd integer > 3
 * @param {number} [rounds=20] Number of independent Miller-Rabin rounds
 * @returns {boolean} True if candidate is very likely prime
 */
function isProbablePrime(n, rounds = 20) {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if ((n & 1n) === 0n) return false;

  // Fast pre-check
  if (!passesSmallPrimes(n)) return false;

  // Write n - 1 as 2^s * d with d odd
  let d = n - 1n;
  let s = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  const nMinus1 = n - 1n;
  const nMinus3 = n - 3n;

  // Run Miller-Rabin witness rounds
  for (let i = 0; i < rounds; i++) {
    // Pick random base a in [2, n - 2]
    const a = randomBigInt(2n, n - 2n);
    let x = modPow(a, d, n);

    if (x === 1n || x === nMinus1) {
      continue;
    }

    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === nMinus1) {
        composite = false;
        break;
      }
      if (x === 1n) {
        return false;
      }
    }

    if (composite) {
      return false;
    }
  }

  return true;
}

/**
 * Generates a random prime BigInt of the specified bit length.
 *
 * @param {number} bitLength (e.g. 256, 384, 512)
 * @returns {bigint} Prime BigInt
 */
function generatePrime(bitLength = 256) {
  if (bitLength < 8) throw new Error('Bit length must be at least 8');

  const min = 1n << BigInt(bitLength - 1);
  const max = (1n << BigInt(bitLength)) - 1n;

  while (true) {
    let candidate = randomBigInt(min, max);
    // Ensure highest bit is set and candidate is odd
    candidate |= 1n;
    candidate |= min;

    if (isProbablePrime(candidate, 20)) {
      return candidate;
    }
  }
}

module.exports = {
  isProbablePrime,
  generatePrime,
};
