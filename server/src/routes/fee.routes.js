import { Router } from 'express';
import {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
} from '../controllers/fee.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { feeStructureSchema } from '../schemas/fee.schema.js';

const router = Router();

router.use(authenticateToken);
router.use(enforceTenantScope);

router.get('/', getFeeStructures);
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  validateBody(feeStructureSchema),
  createFeeStructure
);
router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  updateFeeStructure
);

export default router;
