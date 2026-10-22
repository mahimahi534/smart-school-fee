import { Router } from 'express';
import {
  recordPayment,
  getPayments,
  getPaymentReceipt,
  reversePayment,
} from '../controllers/payment.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { recordPaymentSchema, reversePaymentSchema } from '../schemas/payment.schema.js';

const router = Router();

router.use(authenticateToken);
router.use(enforceTenantScope);

router.get('/', getPayments);
router.get('/:id/receipt', getPaymentReceipt);
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'CASHIER', 'ACCOUNTANT'),
  validateBody(recordPaymentSchema),
  recordPayment
);
router.post(
  '/:id/reverse',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  validateBody(reversePaymentSchema),
  reversePayment
);

export default router;
