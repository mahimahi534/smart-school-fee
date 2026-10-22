import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  registerStudent,
  updateStudent,
  updateStudentStatus,
} from '../controllers/student.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerStudentSchema, updateStudentSchema } from '../schemas/student.schema.js';

const router = Router();

router.use(authenticateToken);
router.use(enforceTenantScope);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'REGISTRAR'),
  validateBody(registerStudentSchema),
  registerStudent
);
router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'REGISTRAR'),
  validateBody(updateStudentSchema),
  updateStudent
);
router.patch(
  '/:id/status',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'REGISTRAR'),
  updateStudentStatus
);

export default router;
