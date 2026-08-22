"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Strict rate-limited OAuth/.edu login
router.post('/login', rateLimiter_1.authLimiter, authController_1.loginWithEduEmail);
// Current user profile
router.get('/me', auth_1.authenticateToken, authController_1.getCurrentUser);
exports.default = router;
