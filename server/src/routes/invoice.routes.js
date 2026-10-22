import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  cancelInvoice,
} from '../controllers/invoice.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createInvoiceSchema } from '../schemas/invoice.schema.js';

const router = Router();

router.use(authenticateToken);
router.use(enforceTenantScope);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'),
  validateBody(createInvoiceSchema),
  createInvoice
);
router.patch(
  '/:id/cancel',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  cancelInvoice
);

export default router;
