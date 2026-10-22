import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { config } from '../config/index.js';

export const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No access token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch user from DB to ensure still active and valid
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        school: true,
        branch: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or no longer exists.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed access token.',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Allows specified roles. SUPER_ADMIN is always allowed.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to perform this action.`,
      });
    }

    next();
  };
};

/**
 * Enforces School & Branch isolation.
 * Prevents non-super-admins from accessing other schools or branches.
 */
export const enforceTenantScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }

  // Super Admin has global access
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // School Admin is bound to their school
  if (!req.user.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'User is not associated with any active school.',
    });
  }

  // Automatically enforce schoolId filter
  req.tenantSchoolId = req.user.schoolId;

  // If user is branch-scoped (BRANCH_ADMIN, CASHIER, REGISTRAR), enforce branchId
  if (['BRANCH_ADMIN', 'CASHIER', 'REGISTRAR'].includes(req.user.role)) {
    req.tenantBranchId = req.user.branchId;
  }

  next();
};
