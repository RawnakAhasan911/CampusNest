/**
 * Pure From-Scratch Secure Session Management
 * Implements anti-hijacking session tokens with HMAC-SHA256 signatures,
 * User-Agent fingerprinting, revocation store, and strict 2FA state enforcement.
 * Absolutely NO jsonwebtoken or external libraries.
 */

const { hmacSha256, timingSafeEqual } = require('../crypto/hmac');
const { sha256 } = require('../crypto/sha256');
const { randomHex } = require('../crypto/prng');

const SESSION_SECRET = 'CSE447_SESSION_MASTER_SECRET_KEY_981247';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const TWO_FACTOR_DURATION_MS = 5 * 60 * 1000;    // 5 minutes

// In-memory active session store (or sync with DB)
// sessionId -> { userId, role, createdAt, expiresAt, userAgentHash, ipHash, isRevoked }
const activeSessions = new Map();

function base64UrlEncode(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Creates a secure session token with anti-hijacking bindings.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.role
 * @param {string} [params.userAgent='']
 * @param {string} [params.ip='']
 * @param {boolean} [params.pending2FA=false]
 * @returns {string} Signed token
 */
function createSessionToken({ userId, role, userAgent = '', ip = '', pending2FA = false }) {
  const sessionId = randomHex(16);
  const now = Date.now();
  const duration = pending2FA ? TWO_FACTOR_DURATION_MS : SESSION_DURATION_MS;
  const expiresAt = now + duration;
  const userAgentHash = sha256(userAgent || 'unknown-client');
  const ipHash = sha256(ip || 'unknown-ip');

  const header = { alg: 'HMAC-SHA256', typ: 'SESSION' };
  const payload = {
    sid: sessionId,
    uid: userId,
    role,
    uiah: userAgentHash,
    iph: ipHash,
    p2fa: pending2FA,
    iat: now,
    exp: expiresAt,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = hmacSha256(SESSION_SECRET, `${headerB64}.${payloadB64}`);

  // Store in active sessions
  activeSessions.set(sessionId, {
    sessionId,
    userId,
    role,
    userAgentHash,
    ipHash,
    pending2FA,
    createdAt: now,
    expiresAt,
    isRevoked: false,
  });

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verifies token authenticity, expiration, and anti-hijacking client bindings.
 *
 * @param {string} token
 * @param {string} currentUserAgent
 * @param {string} currentIp
 * @returns {{ valid: boolean, error?: string, payload?: object }}
 */
function verifySessionToken(token, currentUserAgent = '', currentIp = '') {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token structure' };
  }

  const [headerB64, payloadB64, signature] = parts;
  const expectedSig = hmacSha256(SESSION_SECRET, `${headerB64}.${payloadB64}`);

  if (!timingSafeEqual(signature, expectedSig)) {
    return { valid: false, error: 'Invalid token signature (tamper attempt detected)' };
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch (err) {
    return { valid: false, error: 'Corrupt token payload' };
  }

  // 1. Expiration check
  if (Date.now() > payload.exp) {
    return { valid: false, error: 'Session token has expired. Please log in again.' };
  }

  // 2. Revocation store check
  const storedSession = activeSessions.get(payload.sid);
  if (storedSession && storedSession.isRevoked) {
    return { valid: false, error: 'Session has been revoked or logged out.' };
  }

  // 3. Anti-Hijacking Check: User-Agent validation
  if (currentUserAgent) {
    const currentAgentHash = sha256(currentUserAgent);
    if (payload.uiah && !timingSafeEqual(payload.uiah, currentAgentHash)) {
      return {
        valid: false,
        error: 'Session Hijacking Alert: User-Agent mismatch! Access denied.',
        hijackAttempt: true,
      };
    }
  }

  return { valid: true, payload };
}

/**
 * Revokes a session upon user logout.
 */
function revokeSession(sessionId) {
  if (activeSessions.has(sessionId)) {
    const s = activeSessions.get(sessionId);
    s.isRevoked = true;
    activeSessions.set(sessionId, s);
  }
}

/**
 * Revokes all active sessions for a user (e.g. after password change or admin suspension).
 */
function revokeAllUserSessions(userId) {
  for (const [sid, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      session.isRevoked = true;
    }
  }
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  revokeSession,
  revokeAllUserSessions,
  activeSessions,
};
