import { Router } from 'express';
import {
  submitClaim,
  reviewClaim,
  sendItemMessage,
} from '../controllers/claimsController';
import { authenticateToken } from '../middleware/auth';
import { claimLimiter } from '../middleware/rateLimiter';

const router = Router();

// Submit a claim on an item (Rate-limited)
router.post('/', authenticateToken, claimLimiter, submitClaim);

// Review claim (approve / reject)
router.patch('/:claimId/review', authenticateToken, reviewClaim);

// Send real-time chat message for an item
router.post('/item/:itemId/messages', authenticateToken, sendItemMessage);

export default router;
