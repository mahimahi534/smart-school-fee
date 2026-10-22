import { Router } from 'express';
import {
  getSchools,
  getCurrentSchool,
  updateCurrentSchool,
  getBranches,
  createBranch,
  getStaff,
  createStaff,
  toggleStaffStatus,
} from '../controllers/school.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Schools
router.get('/', authorizeRoles('SUPER_ADMIN'), getSchools);
router.get('/current', getCurrentSchool);
router.put('/current', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateCurrentSchool);

// Branches
router.get('/branches', enforceTenantScope, getBranches);
router.post('/branches', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), createBranch);

// Staff management
router.get('/staff', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN'), enforceTenantScope, getStaff);
router.post('/staff', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), createStaff);
router.patch('/staff/:id/toggle-status', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), toggleStaffStatus);

export default router;
