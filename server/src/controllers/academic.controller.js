import { prisma } from '../prisma.js';
import { logAuditEvent } from '../utils/audit.js';

// --- Academic Years ---
export const getAcademicYears = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const years = await prisma.academicYear.findMany({
      where: schoolId ? { schoolId } : {},
      include: {
        terms: true,
        _count: { select: { enrollments: true, invoices: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json({ success: true, data: years });
  } catch (error) {
    next(error);
  }
};

export const createAcademicYear = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const { name, startDate, endDate, isCurrent } = req.body;

    // If isCurrent is true, unset current on other years
    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { schoolId },
        data: { isCurrent: false },
      });
    }

    const year = await prisma.academicYear.create({
      data: {
        schoolId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
      },
    });

    await logAuditEvent({
      schoolId,
      actor: req.user,
      action: 'ACADEMIC_YEAR_CREATED',
      entityType: 'AcademicYear',
      entityId: year.id,
      details: { name: year.name },
      req,
    });

    res.status(201).json({ success: true, message: 'Academic year created successfully.', data: year });
  } catch (error) {
    next(error);
  }
};

// --- Academic Terms ---
export const getTerms = async (req, res, next) => {
  try {
    const { academicYearId } = req.query;
    const where = academicYearId ? { academicYearId } : {};

    const terms = await prisma.academicTerm.findMany({
      where,
      include: { academicYear: true },
      orderBy: { startDate: 'asc' },
    });
    res.json({ success: true, data: terms });
  } catch (error) {
    next(error);
  }
};

export const createTerm = async (req, res, next) => {
  try {
    const { academicYearId, name, nameAmharic, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      await prisma.academicTerm.updateMany({
        where: { academicYearId },
        data: { isCurrent: false },
      });
    }

    const term = await prisma.academicTerm.create({
      data: {
        academicYearId,
        name,
        nameAmharic,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
      },
    });

    res.status(201).json({ success: true, message: 'Term created successfully.', data: term });
  } catch (error) {
    next(error);
  }
};

// --- Grades ---
export const getGrades = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const grades = await prisma.grade.findMany({
      where: schoolId ? { schoolId } : {},
      include: {
        classSections: {
          include: { branch: true },
        },
      },
      orderBy: { levelOrder: 'asc' },
    });
    res.json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
};

export const createGrade = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const { name, nameAmharic, levelOrder, description } = req.body;

    const grade = await prisma.grade.create({
      data: {
        schoolId,
        name,
        nameAmharic,
        levelOrder: levelOrder || 1,
        description,
      },
    });

    res.status(201).json({ success: true, message: 'Grade level created successfully.', data: grade });
  } catch (error) {
    next(error);
  }
};

// --- Class Sections ---
export const getClassSections = async (req, res, next) => {
  try {
    const { gradeId, branchId } = req.query;
    const where = {
      ...(gradeId && { gradeId }),
      ...(branchId && { branchId }),
      ...(req.tenantBranchId && { branchId: req.tenantBranchId }),
    };

    const sections = await prisma.classSection.findMany({
      where,
      include: {
        grade: true,
        branch: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: sections });
  } catch (error) {
    next(error);
  }
};

export const createClassSection = async (req, res, next) => {
  try {
    const { gradeId, branchId, name, capacity, roomNumber } = req.body;

    const section = await prisma.classSection.create({
      data: {
        gradeId,
        branchId,
        name,
        capacity: capacity || 40,
        roomNumber,
      },
      include: { grade: true, branch: true },
    });

    res.status(201).json({ success: true, message: 'Class section created successfully.', data: section });
  } catch (error) {
    next(error);
  }
};
