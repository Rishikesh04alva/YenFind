"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const claimsController_1 = require("../controllers/claimsController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Submit a claim on an item (Rate-limited)
router.post('/', auth_1.authenticateToken, rateLimiter_1.claimLimiter, claimsController_1.submitClaim);
// Review claim (approve / reject)
router.patch('/:claimId/review', auth_1.authenticateToken, claimsController_1.reviewClaim);
// Send real-time chat message for an item
router.post('/item/:itemId/messages', auth_1.authenticateToken, claimsController_1.sendItemMessage);
exports.default = router;
