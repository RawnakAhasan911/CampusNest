/**
 * Authentication Middleware
 * Validates session tokens, enforces anti-hijacking protections,
 * and attaches verified user context.
 */

const { verifySessionToken } = require('./sessionManager');
const { User } = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: Missing or invalid authorization header',
      });
    }

    const token = authHeader.split(' ')[1];
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';

    const verification = verifySessionToken(token, userAgent, ip);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.error || 'Invalid session',
        hijackAlert: verification.hijackAttempt || false,
      });
    }

    if (verification.payload.p2fa) {
      return res.status(403).json({
        success: false,
        message: 'Two-Factor Authentication (2FA) OTP required before accessing this resource',
        requires2FA: true,
      });
    }

    const user = await User.findById(verification.payload.uid);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with session no longer exists',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator for safety violations',
      });
    }

    req.user = user;
    req.session = verification.payload;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ success: false, message: 'Internal authentication error' });
  }
}

/**
 * Optional authentication middleware for public endpoints where user context is useful if present.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || '';
      const verification = verifySessionToken(token, userAgent, ip);
      if (verification.valid && !verification.payload.p2fa) {
        const user = await User.findById(verification.payload.uid);
        if (user && user.status !== 'suspended') {
          req.user = user;
          req.session = verification.payload;
        }
      }
    }
  } catch (err) {
    // Ignore and proceed unauthenticated
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
};
