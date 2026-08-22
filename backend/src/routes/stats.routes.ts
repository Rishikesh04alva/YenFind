import { Router } from 'express';
import {
  getCampusStats,
  getUserNotifications,
  markNotificationAsRead,
  getLeaderboard,
} from '../controllers/statsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public campus statistics
router.get('/campus-metrics', getCampusStats);

// Campus Leaderboard (Top 3 featured heroes + rankings)
router.get('/leaderboard', getLeaderboard);

// User notification feed
router.get('/notifications', authenticateToken, getUserNotifications);

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, markNotificationAsRead);

export default router;
