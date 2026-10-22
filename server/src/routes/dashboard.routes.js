import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticateToken, enforceTenantScope } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateToken, enforceTenantScope, getDashboardStats);

export default router;
