import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

/**
 * Canonical role normalizer: maps any role variation to 'citizen' | 'agent' | 'admin'
 */
export const normalizeRole = (role) => {
  if (!role) return 'citizen';
  const r = String(role).trim().toLowerCase();
  if (r === 'user' || r === 'citizen') return 'citizen';
  if (r === 'agent') return 'agent';
  if (
    r === 'admin' ||
    r === 'government_officer' ||
    r === 'government officer' ||
    r === 'gov_auditor'
  ) {
    return 'admin';
  }
  return 'citizen';
};

/**
 * Standard Express Authentication Middleware:
 * Verifies JWT token from cookies or Authorization header and attaches req.user
 */
export const verifyUser = (req, res, next) => {
  // Extract token from httpOnly cookie or Authorization header Bearer token
  const token =
    req.cookies?.access_token ||
    (req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    const error = errorHandler
      ? errorHandler(401, 'Unauthorized: Access token is missing')
      : new Error('Unauthorized');
    if (typeof next === 'function') {
      return next(error);
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'civicestate_jwt_secret_key_2081';

  jwt.verify(token, jwtSecret, (err, decodedUser) => {
    if (err) {
      const error = errorHandler
        ? errorHandler(403, 'Forbidden: Invalid or expired token')
        : new Error('Forbidden');
      if (typeof next === 'function') {
        return next(error);
      }
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Attach canonical user identity to request object
    req.user = {
      ...decodedUser,
      id: decodedUser.id || decodedUser._id,
      role: normalizeRole(decodedUser.role),
    };

    if (typeof next === 'function') {
      return next();
    }
  });
};

export const verifyToken = verifyUser;

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Supports factory usage: authorizeRoles('agent', 'admin')
 * Also resilient against direct middleware passing: router.use(authorizeRoles)
 */
export const authorizeRoles = (...roles) => {
  // Resilient Guard: If passed directly without invocation (req, res, next)
  if (roles.length > 0 && typeof roles[0] === 'object' && roles[0]?.headers) {
    const req = roles[0];
    const res = roles[1];
    const next = roles[2];

    if (!req.user) {
      const err = errorHandler
        ? errorHandler(401, 'Unauthorized: User not authenticated')
        : new Error('Unauthorized');
      return typeof next === 'function'
        ? next(err)
        : res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    return typeof next === 'function' ? next() : undefined;
  }

  const allowedRoles = roles.map((r) => normalizeRole(r));

  return (req, res, next) => {
    if (!req.user) {
      const err = errorHandler
        ? errorHandler(401, 'Unauthorized: User not authenticated')
        : new Error('Unauthorized');
      if (typeof next === 'function') {
        return next(err);
      }
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRole = normalizeRole(req.user.role);

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      const err = errorHandler
        ? errorHandler(403, `Forbidden: Requires [${roles.join(', ')}] clearance`)
        : new Error('Forbidden: Insufficient privileges');
      if (typeof next === 'function') {
        return next(err);
      }
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (typeof next === 'function') {
      return next();
    }
  };
};