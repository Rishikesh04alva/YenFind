"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const sanitize_1 = require("./middleware/sanitize");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const items_routes_1 = __importDefault(require("./routes/items.routes"));
const claims_routes_1 = __importDefault(require("./routes/claims.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
// 1. Socket.IO Gateway Setup
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
    },
});
exports.io = io;
app.set('io', io);
// 2. Security Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows images to load in frontend
}));
app.use((0, cors_1.default)({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
// 3. Body Parsing & Sanitization
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitize_1.sanitizeInput);
// 4. Rate Limiting for all API routes
app.use('/api/', rateLimiter_1.apiLimiter);
// 5. Static Uploads Serving (Scrubbed and sanitized WebP images)
const uploadDir = path_1.default.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express_1.default.static(uploadDir));
// 6. Application Routes (Supports direct /api or cloud proxy /api/backend)
const router = express_1.default.Router();
router.use('/auth', auth_routes_1.default);
router.use('/items', items_routes_1.default);
router.use('/claims', claims_routes_1.default);
router.use('/stats', stats_routes_1.default);
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
    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`[Socket.io] User ${userId} joined room user_${userId}`);
        }
    });
    // User joins an item chat/activity room
    socket.on('join_item_room', (itemId) => {
        if (itemId) {
            socket.join(`item_${itemId}`);
            console.log(`[Socket.io] Socket ${socket.id} joined item_${itemId}`);
        }
    });
    socket.on('leave_item_room', (itemId) => {
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
