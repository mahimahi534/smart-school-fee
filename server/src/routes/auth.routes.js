import { Router } from 'express';
import { login, logout, getMe, changePassword, bootstrapAdmin } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema, bootstrapAdminSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.post('/change-password', authenticateToken, validateBody(changePasswordSchema), changePassword);
router.post('/bootstrap-admin', validateBody(bootstrapAdminSchema), bootstrapAdmin);

export default router;
