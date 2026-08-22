import { Router } from 'express';
import { loginWithEduEmail, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Strict rate-limited OAuth/.edu login
router.post('/login', authLimiter, loginWithEduEmail);

// Current user profile
router.get('/me', authenticateToken, getCurrentUser);

export default router;
