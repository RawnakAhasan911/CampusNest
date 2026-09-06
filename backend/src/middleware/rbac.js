/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces least-privilege boundaries between Students and Administrators.
 */

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this operation',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `RBAC Access Denied: Insufficient privileges. Required role(s): [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'University email address must be verified before proceeding.',
      needsEmailVerification: true,
    });
  }

  next();
}

module.exports = {
  requireRole,
  requireEmailVerified,
};
