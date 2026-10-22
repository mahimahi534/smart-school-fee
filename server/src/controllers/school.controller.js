import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { logAuditEvent } from '../utils/audit.js';

export const getSchools = async (req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        branches: true,
        _count: {
          select: { students: true, users: true, invoices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: schools });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSchool = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(404).json({ success: false, message: 'No school associated with user' });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        branches: true,
      },
    });

    res.json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
};

export const updateCurrentSchool = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const { name, nameAmharic, phone, email, address, city, studentIdPrefix, invoicePrefix, receiptPrefix } = req.body;

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name,
        nameAmharic,
        phone,
        email,
        address,
        city,
        studentIdPrefix,
        invoicePrefix,
        receiptPrefix,
      },
    });

    await logAuditEvent({
      schoolId,
      actor: req.user,
      action: 'SCHOOL_PROFILE_UPDATED',
      entityType: 'School',
      entityId: schoolId,
      details: req.body,
      req,
    });

    res.json({ success: true, message: 'School profile updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
};

export const getBranches = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const where = schoolId ? { schoolId } : {};

    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: { students: true, users: true, classSections: true },
        },
      },
      orderBy: { isMain: 'desc' },
    });

    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.body.schoolId;
    const { code, name, nameAmharic, phone, email, address, city, isMain } = req.body;

    const branch = await prisma.branch.create({
      data: {
        schoolId,
        code: code.toUpperCase().trim(),
        name,
        nameAmharic,
        phone,
        email,
        address,
        city,
        isMain: Boolean(isMain),
      },
    });

    await logAuditEvent({
      schoolId,
      branchId: branch.id,
      actor: req.user,
      action: 'BRANCH_CREATED',
      entityType: 'Branch',
      entityId: branch.id,
      details: { code: branch.code, name: branch.name },
      req,
    });

    res.status(201).json({ success: true, message: 'Branch created successfully.', data: branch });
  } catch (error) {
    next(error);
  }
};

export const getStaff = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const where = {
      schoolId,
      ...(req.tenantBranchId && { branchId: req.tenantBranchId }),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        fullNameAmharic: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const { email, password, fullName, fullNameAmharic, phone, role, branchId } = req.body;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Password123!', salt);

    const user = await prisma.user.create({
      data: {
        schoolId,
        branchId: branchId || null,
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        fullNameAmharic,
        phone,
        role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
      },
    });

    await logAuditEvent({
      schoolId,
      branchId: user.branchId,
      actor: req.user,
      action: 'STAFF_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      req,
    });

    res.status(201).json({ success: true, message: 'Staff user created successfully.', data: user });
  } catch (error) {
    next(error);
  }
};

export const toggleStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate Super Admin.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    await logAuditEvent({
      schoolId: user.schoolId,
      branchId: user.branchId,
      actor: req.user,
      action: updated.isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, isActive: updated.isActive },
      req,
    });

    res.json({
      success: true,
      message: `Staff account ${updated.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { id: updated.id, isActive: updated.isActive },
    });
  } catch (error) {
    next(error);
  }
};
