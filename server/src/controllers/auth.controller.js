import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { config } from '../config/index.js';
import { logAuditEvent } from '../utils/audit.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        school: true,
        branch: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Generate JWT access token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      branchId: user.branchId,
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set secure HTTP-only cookie if needed
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Log audit event
    await logAuditEvent({
      schoolId: user.schoolId,
      branchId: user.branchId,
      actor: user,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      req,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        fullNameAmharic: user.fullNameAmharic,
        role: user.role,
        school: user.school,
        branch: user.branch,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('access_token');
    if (req.user) {
      await logAuditEvent({
        schoolId: req.user.schoolId,
        branchId: req.user.branchId,
        actor: req.user,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user.id,
        details: {},
        req,
      });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      fullNameAmharic: req.user.fullNameAmharic,
      phone: req.user.phone,
      role: req.user.role,
      school: req.user.school,
      branch: req.user.branch,
      lastLoginAt: req.user.lastLoginAt,
    },
  });
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await logAuditEvent({
      schoolId: user.schoolId,
      branchId: user.branchId,
      actor: user,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      details: {},
      req,
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

export const bootstrapAdmin = async (req, res, next) => {
  try {
    const { setupSecret, email, password, fullName, fullNameAmharic, phone } = req.body;

    // Verify setup secret
    if (setupSecret !== config.adminSetupSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin setup secret token.',
      });
    }

    // Check if superadmin already exists
    const existing = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existing) {
      // Allow recovery of existing Super Admin with the secret
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          fullNameAmharic: fullNameAmharic || null,
          phone: phone || null,
          isActive: true,
        },
      });

      return res.json({
        success: true,
        message: 'Super Admin credentials reset successfully via setup secret.',
        userId: updated.id,
      });
    }

    const created = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        fullNameAmharic: fullNameAmharic || null,
        phone: phone || null,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'First Super Admin initialized successfully.',
      userId: created.id,
    });
  } catch (error) {
    next(error);
  }
};
