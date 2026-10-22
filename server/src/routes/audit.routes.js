import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(enforceTenantScope);
router.use(authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'));

router.get('/', getAuditLogs);

export default router;
