"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public campus statistics
router.get('/campus-metrics', statsController_1.getCampusStats);
// Campus Leaderboard (Top 3 featured heroes + rankings)
router.get('/leaderboard', statsController_1.getLeaderboard);
// User notification feed
router.get('/notifications', auth_1.authenticateToken, statsController_1.getUserNotifications);
// Mark notification as read
router.patch('/notifications/:id/read', auth_1.authenticateToken, statsController_1.markNotificationAsRead);
exports.default = router;
