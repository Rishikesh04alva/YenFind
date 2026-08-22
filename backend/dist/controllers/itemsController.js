"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = createItem;
exports.getItems = getItems;
exports.getItemById = getItemById;
exports.updateItemStatus = updateItemStatus;
exports.verifyHandoverScan = verifyHandoverScan;
const db_1 = require("../config/db");
const imageService_1 = require("../services/imageService");
const matcherService_1 = require("../services/matcherService");
const crypto_1 = __importDefault(require("crypto"));
async function createItem(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required to post items.' });
        }
        const { type, title, description, category, locationName, latitude, longitude, dateLostOrFound, contactEmail, isAnonymous, secretQuestion, } = req.body;
        if (!type || !title || !description || !category || !locationName) {
            return res.status(400).json({
                success: false,
                error: 'Please fill in all required fields: type, title, description, category, locationName.',
            });
        }
        const lat = parseFloat(latitude) || 12.8703;
        const lng = parseFloat(longitude) || 74.8465;
        let imageUrl = undefined;
        let thumbnailUrl = undefined;
        // Process image if uploaded through multer
        if (req.file) {
            const sanitizedImage = await (0, imageService_1.sanitizeAndSaveImage)(req.file.buffer, req.file.originalname);
            imageUrl = sanitizedImage.imageUrl;
            thumbnailUrl = sanitizedImage.thumbnailUrl;
        }
        const itemType = type.toUpperCase() === 'FOUND' ? 'FOUND' : 'LOST';
        // Generate unique 8-character handover code for QR scan verification
        const handoverCode = `YEN-${crypto_1.default.randomBytes(3).toString('hex').toUpperCase()}`;
        const item = await db_1.prisma.item.create({
            data: {
                type: itemType,
                title: title.trim(),
                description: description.trim(),
                category: category.toUpperCase(),
                locationName: locationName.trim(),
                latitude: lat,
                longitude: lng,
                imageUrl,
                thumbnailUrl,
                dateLostOrFound: dateLostOrFound ? new Date(dateLostOrFound) : new Date(),
                contactEmail: contactEmail || req.user.email,
                isAnonymous: isAnonymous === 'true' || isAnonymous === true,
                secretQuestion: secretQuestion?.trim() || null,
                handoverCode,
                userId: req.user.id,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, campusName: true, points: true },
                },
            },
        });
        // Reward reporting points (10 pts for Lost report, 20 pts for Found report)
        const reportPoints = itemType === 'FOUND' ? 20 : 10;
        await db_1.prisma.user.update({
            where: { id: req.user.id },
            data: { points: { increment: reportPoints } },
        });
        // Access Socket.io instance from app
        const io = req.app.get('io');
        // Run real-time match engine
        const matches = await (0, matcherService_1.runMatchmakerForItem)(item, io);
        // Broadcast new item to all connected clients
        if (io) {
            io.emit('new_item_posted', {
                item,
                matchesCount: matches.length,
            });
            io.emit('leaderboard_updated');
        }
        return res.status(201).json({
            success: true,
            message: `Successfully posted ${item.type.toLowerCase()} item report. Image EXIF metadata was scrubbed for security. You earned +${reportPoints} Campus Points!`,
            item,
            pointsEarned: reportPoints,
            matchesFound: matches.length,
            matches,
        });
    }
    catch (error) {
        console.error('Error creating item:', error);
        return res.status(500).json({ success: false, error: 'Failed to create item post.' });
    }
}
async function getItems(req, res) {
    try {
        const { type, category, status, search, lat, lng, radiusMeters, limit = 50, offset = 0, } = req.query;
        const where = {};
        if (type && typeof type === 'string' && ['LOST', 'FOUND'].includes(type.toUpperCase())) {
            where.type = type.toUpperCase();
        }
        if (category && typeof category === 'string' && category !== 'ALL') {
            where.category = category.toUpperCase();
        }
        if (status && typeof status === 'string' && status !== 'ALL') {
            where.status = status.toUpperCase();
        }
        else {
            where.status = 'OPEN'; // Default to open items
        }
        if (search && typeof search === 'string') {
            const searchTerms = search.trim();
            where.OR = [
                { title: { contains: searchTerms } },
                { description: { contains: searchTerms } },
                { locationName: { contains: searchTerms } },
            ];
        }
        const items = await db_1.prisma.item.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
            include: {
                user: {
                    select: { id: true, name: true, email: true, campusName: true, points: true },
                },
                _count: {
                    select: { claims: true },
                },
            },
        });
        // Optional Geo-Radius filter
        let filteredItems = items;
        if (lat && lng && radiusMeters) {
            const centerLat = parseFloat(lat);
            const centerLng = parseFloat(lng);
            const maxRadius = parseFloat(radiusMeters);
            if (!isNaN(centerLat) && !isNaN(centerLng) && !isNaN(maxRadius)) {
                filteredItems = items.filter((item) => {
                    const dist = (0, matcherService_1.calculateDistanceInMeters)(centerLat, centerLng, item.latitude, item.longitude);
                    return dist <= maxRadius;
                });
            }
        }
        return res.json({
            success: true,
            count: filteredItems.length,
            items: filteredItems,
        });
    }
    catch (error) {
        console.error('Error fetching items:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve items.' });
    }
}
async function getItemById(req, res) {
    try {
        const { id } = req.params;
        const item = await db_1.prisma.item.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, campusName: true, points: true },
                },
                claims: {
                    include: {
                        claimant: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                messages: {
                    include: {
                        sender: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found.' });
        }
        // Mask sensitive contact details if anonymous and viewer is not owner
        const isOwner = req.user && req.user.id === item.userId;
        const sanitizedItem = {
            ...item,
            // Handover code is accessible only to the item owner/receiver or authorized admin
            handoverCode: isOwner ? item.handoverCode : (item.status === 'RESOLVED' ? null : 'ACTIVE_SECURED'),
            user: item.isAnonymous && !isOwner
                ? { id: 'anon', name: 'Anonymous Campus Member', email: null, campusName: item.user.campusName }
                : item.user,
            contactEmail: item.isAnonymous && !isOwner ? null : item.contactEmail,
            secretQuestion: isOwner ? item.secretQuestion : (item.secretQuestion ? 'Verification Question Active' : null),
        };
        return res.json({
            success: true,
            item: sanitizedItem,
            isOwner,
            actualHandoverCode: isOwner ? item.handoverCode : null,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to retrieve item details.' });
    }
}
async function updateItemStatus(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized.' });
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!['OPEN', 'CLAIMED', 'RESOLVED'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status value.' });
        }
        const item = await db_1.prisma.item.findUnique({ where: { id } });
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found.' });
        }
        if (item.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Only the item poster or admin can update status.' });
        }
        const updated = await db_1.prisma.item.update({
            where: { id },
            data: { status },
        });
        // Reward +100 bonus points and increment itemsReturned if successfully RESOLVED
        if (status === 'RESOLVED' && !item.pointsAwarded) {
            await db_1.prisma.user.update({
                where: { id: item.userId },
                data: {
                    points: { increment: 100 },
                    itemsReturned: { increment: 1 },
                },
            });
            await db_1.prisma.item.update({
                where: { id },
                data: { pointsAwarded: true },
            });
        }
        const io = req.app.get('io');
        if (io) {
            io.emit('item_status_updated', { itemId: id, status });
            io.emit('leaderboard_updated');
        }
        return res.json({
            success: true,
            item: updated,
            message: status === 'RESOLVED' ? 'Item marked returned! +100 Campus Points awarded to hero.' : 'Status updated.',
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to update item status.' });
    }
}
// QR Code Handover Scan Verification & Instant Point Dispatcher
async function verifyHandoverScan(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Please sign in to scan the recipient QR handover code.' });
        }
        const { itemId, handoverCode } = req.body;
        if (!itemId || !handoverCode) {
            return res.status(400).json({
                success: false,
                error: 'Item ID and Handover Code are required to verify the return.',
            });
        }
        const item = await db_1.prisma.item.findUnique({
            where: { id: itemId },
            include: { user: true },
        });
        if (!item) {
            return res.status(404).json({ success: false, error: 'Incident report not found.' });
        }
        if (item.status === 'RESOLVED' && item.pointsAwarded) {
            return res.status(400).json({
                success: false,
                error: 'This item has already been marked returned and points were previously dispatched.',
            });
        }
        if (item.userId === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Security Notice: You cannot scan your own QR code. Only the finder/returner who returned your item can scan it to claim points.',
            });
        }
        // Verify the scanned code against database handoverCode
        if (item.handoverCode?.toUpperCase() !== handoverCode.trim().toUpperCase()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid QR verification code. Please make sure you scanned the genuine recipient QR code.',
            });
        }
        // Mark item as RESOLVED and points awarded
        const updatedItem = await db_1.prisma.item.update({
            where: { id: itemId },
            data: {
                status: 'RESOLVED',
                pointsAwarded: true,
            },
        });
        // Reward +100 points directly to the RETURNER (logged in scanner)
        const returnerUser = await db_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                points: { increment: 100 },
                itemsReturned: { increment: 1 },
            },
        });
        const io = req.app.get('io');
        if (io) {
            io.emit('item_status_updated', { itemId: item.id, status: 'RESOLVED' });
            io.emit('leaderboard_updated');
            io.to(`user_${item.userId}`).emit('handover_completed', {
                itemId: item.id,
                itemTitle: item.title,
                returnerName: req.user.name,
            });
        }
        return res.json({
            success: true,
            message: `🎉 Handover Verified! +100 Campus Karma Points added to your account (${req.user.name}).`,
            pointsAwarded: 100,
            totalPoints: returnerUser.points,
            itemsReturned: returnerUser.itemsReturned,
            item: updatedItem,
        });
    }
    catch (error) {
        console.error('Error verifying handover scan:', error);
        return res.status(500).json({ success: false, error: 'Failed to verify handover scan.' });
    }
}
