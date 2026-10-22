import { prisma } from '../prisma.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const { action, entityType, page = 1, limit = 25 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {
      ...(schoolId && { schoolId }),
      ...(branchId && { branchId }),
      ...(action && { action }),
      ...(entityType && { entityType }),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};
