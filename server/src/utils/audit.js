import { prisma } from '../prisma.js';

export async function logAuditEvent({
  schoolId,
  branchId,
  actor,
  action,
  entityType,
  entityId,
  details,
  req,
}) {
  try {
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        schoolId: schoolId || actor?.schoolId || null,
        branchId: branchId || actor?.branchId || null,
        actorId: actor?.id || null,
        actorEmail: actor?.email || 'system',
        actorName: actor?.fullName || 'System Event',
        actorRole: actor?.role || 'VIEWER',
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress: String(ipAddress),
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR] Failed to record audit event:', error);
  }
}
