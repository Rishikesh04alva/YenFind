import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

import { sanitizeInput } from './middleware/sanitize';
import { apiLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth.routes';
import itemsRoutes from './routes/items.routes';
import claimsRoutes from './routes/claims.routes';
import statsRoutes from './routes/stats.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// 1. Socket.IO Gateway Setup
const io = new SocketIOServer(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

// 2. Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows images to load in frontend
  })
);

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

// 3. Body Parsing & Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// 4. Rate Limiting for all API routes
app.use('/api/', apiLimiter);

// 5. Static Uploads Serving (Scrubbed and sanitized WebP images)
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// 6. Application Routes (Supports direct /api or cloud proxy /api/backend)
const router = express.Router();
router.use('/auth', authRoutes);
router.use('/items', itemsRoutes);
router.use('/claims', claimsRoutes);
router.use('/stats', statsRoutes);

app.use('/api', router);
app.use('/api/backend', router);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Campus Lost & Found Backend',
    features: ['EXIF-Stripping', 'Edu-OAuth', 'Real-Time-Sockets', 'Geo-Matcher'],
  });
});

// 7. Socket.io Event Handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // User joins their personal room for match notifications & claim alerts
  socket.on('join_user_room', (userId: string) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`[Socket.io] User ${userId} joined room user_${userId}`);
    }
  });

  // User joins an item chat/activity room
  socket.on('join_item_room', (itemId: string) => {
    if (itemId) {
      socket.join(`item_${itemId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined item_${itemId}`);
    }
  });

  socket.on('leave_item_room', (itemId: string) => {
    if (itemId) {
      socket.leave(`item_${itemId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// 8. Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Campus Lost & Found Server running on port ${PORT}`);
  console.log(`🔒 Security: .edu validation, EXIF stripping, Rate Limiting`);
  console.log(`⚡ Real-Time: Socket.io active on ws://localhost:${PORT}`);
  console.log(`====================================================`);
});

export { app, server, io };
