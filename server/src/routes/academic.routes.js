import { Router } from 'express';
import {
  getAcademicYears,
  createAcademicYear,
  getTerms,
  createTerm,
  getGrades,
  createGrade,
  getClassSections,
  createClassSection,
} from '../controllers/academic.controller.js';
import { authenticateToken, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  academicYearSchema,
  academicTermSchema,
  gradeSchema,
  classSectionSchema,
} from '../schemas/academic.schema.js';

const router = Router();

router.use(authenticateToken);
router.use(enforceTenantScope);

// Academic Years
router.get('/years', getAcademicYears);
router.post('/years', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), validateBody(academicYearSchema), createAcademicYear);

// Terms
router.get('/terms', getTerms);
router.post('/terms', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), validateBody(academicTermSchema), createTerm);

// Grades
router.get('/grades', getGrades);
router.post('/grades', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), validateBody(gradeSchema), createGrade);

// Sections
router.get('/sections', getClassSections);
router.post('/sections', authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'REGISTRAR'), validateBody(classSectionSchema), createClassSection);

export default router;
