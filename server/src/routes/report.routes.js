import { Router } from 'express';
import {
  getDailyCollections,
  getMonthlyCollections,
  getOutstandingReport,
  getCashierReport,
  exportReportCsv,
} from '../controllers/report.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(enforceTenantScope);
router.use(authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT', 'VIEWER'));

router.get('/daily', getDailyCollections);
router.get('/monthly', getMonthlyCollections);
router.get('/outstanding', getOutstandingReport);
router.get('/cashier', getCashierReport);
router.get('/export-csv', exportReportCsv);

export default router;
