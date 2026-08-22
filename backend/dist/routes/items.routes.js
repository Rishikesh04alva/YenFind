"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const itemsController_1 = require("../controllers/itemsController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const imageService_1 = require("../services/imageService");
const router = (0, express_1.Router)();
// Get list of items with filters & radius search (optional auth to see customized details)
router.get('/', auth_1.optionalAuth, itemsController_1.getItems);
// QR Handover Scan Verification & Instant Point Dispatch
router.post('/verify-handover', auth_1.authenticateToken, itemsController_1.verifyHandoverScan);
// Get single item detail
router.get('/:id', auth_1.optionalAuth, itemsController_1.getItemById);
// Create item with EXIF stripping image pipeline
router.post('/', auth_1.authenticateToken, rateLimiter_1.createItemLimiter, imageService_1.uploadMiddleware.single('image'), itemsController_1.createItem);
// Update status (OPEN / CLAIMED / RESOLVED)
router.patch('/:id/status', auth_1.authenticateToken, itemsController_1.updateItemStatus);
exports.default = router;
