import { Router } from 'express';
import { register, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema } from '../validators/authValidator.js';

const router = Router();

router.post('/register', authLimiter, authMiddleware, validate(registerSchema), register);
router.get('/me', authMiddleware, getMe);

export default router;
