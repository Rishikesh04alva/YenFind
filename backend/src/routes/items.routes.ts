import { Router } from 'express';
import {
  createItem,
  getItems,
  getItemById,
  updateItemStatus,
  verifyHandoverScan,
} from '../controllers/itemsController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { createItemLimiter } from '../middleware/rateLimiter';
import { uploadMiddleware } from '../services/imageService';

const router = Router();

// Get list of items with filters & radius search (optional auth to see customized details)
router.get('/', optionalAuth, getItems);

// QR Handover Scan Verification & Instant Point Dispatch
router.post('/verify-handover', authenticateToken, verifyHandoverScan);

// Get single item detail
router.get('/:id', optionalAuth, getItemById);

// Create item with EXIF stripping image pipeline
router.post(
  '/',
  authenticateToken,
  createItemLimiter,
  uploadMiddleware.single('image'),
  createItem
);

// Update status (OPEN / CLAIMED / RESOLVED)
router.patch('/:id/status', authenticateToken, updateItemStatus);

export default router;
