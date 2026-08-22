"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistanceInMeters = calculateDistanceInMeters;
exports.computeItemMatchScore = computeItemMatchScore;
exports.runMatchmakerForItem = runMatchmakerForItem;
const db_1 = require("../config/db");
// Haversine formula to calculate distance between two coordinates in meters
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// Tokenize text into normalized keywords
function tokenize(text) {
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
    return new Set(words);
}
// Jaccard similarity index
function calculateTextSimilarity(text1, text2) {
    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);
    if (tokens1.size === 0 || tokens2.size === 0)
        return 0;
    let intersectionCount = 0;
    tokens1.forEach((token) => {
        if (tokens2.has(token)) {
            intersectionCount++;
        }
    });
    const unionCount = new Set([...tokens1, ...tokens2]).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
}
function computeItemMatchScore(itemA, itemB) {
    let score = 0;
    // 1. Category check (35 pts)
    const categoryMatch = itemA.category === itemB.category;
    if (categoryMatch) {
        score += 35;
    }
    // 2. Text Keyword Similarity (35 pts)
    const titleSim = calculateTextSimilarity(itemA.title, itemB.title);
    const descSim = calculateTextSimilarity(`${itemA.title} ${itemA.description}`, `${itemB.title} ${itemB.description}`);
    const combinedTextSim = Math.max(titleSim, descSim);
    score += Math.round(combinedTextSim * 35);
    // 3. Location Proximity (20 pts)
    const distance = calculateDistanceInMeters(itemA.latitude, itemA.longitude, itemB.latitude, itemB.longitude);
    if (distance <= 100) {
        score += 20;
    }
    else if (distance <= 300) {
        score += 15;
    }
    else if (distance <= 800) {
        score += 10;
    }
    else if (distance <= 1500) {
        score += 5;
    }
    // 4. Time Proximity (10 pts)
    const timeA = new Date(itemA.dateLostOrFound).getTime();
    const timeB = new Date(itemB.dateLostOrFound).getTime();
    const timeDiffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
    if (timeDiffHours <= 24) {
        score += 10;
    }
    else if (timeDiffHours <= 72) {
        score += 7;
    }
    else if (timeDiffHours <= 168) {
        // 7 days
        score += 4;
    }
    return {
        totalScore: Math.min(100, score),
        categoryMatch,
        distanceMeters: Math.round(distance),
        textSimilarity: combinedTextSim,
        timeDiffHours: Math.round(timeDiffHours),
    };
}
/**
 * Executes matching engine against active opposite-type items and emits real-time alerts
 */
async function runMatchmakerForItem(newItem, io) {
    const targetType = newItem.type === 'LOST' ? 'FOUND' : 'LOST';
    // Find open items of opposite type
    const potentialMatches = await db_1.prisma.item.findMany({
        where: {
            type: targetType,
            status: 'OPEN',
            id: { not: newItem.id },
        },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
        },
    });
    const matchedResults = [];
    for (const candidate of potentialMatches) {
        const match = computeItemMatchScore(newItem, candidate);
        // If match confidence >= 45%
        if (match.totalScore >= 45) {
            const lostItem = newItem.type === 'LOST' ? newItem : candidate;
            const foundItem = newItem.type === 'FOUND' ? newItem : candidate;
            // Save notification for both users (or the owner of the existing item)
            const notifyUserId = candidate.userId;
            const notificationTitle = `Potential Match Found (${match.totalScore}% Confidence)`;
            const notificationMessage = newItem.type === 'FOUND'
                ? `A found item "${newItem.title}" near ${newItem.locationName} may match your lost "${candidate.title}".`
                : `A new lost report "${newItem.title}" may match the item you found "${candidate.title}".`;
            const notificationRecord = await db_1.prisma.matchNotification.create({
                data: {
                    userId: notifyUserId,
                    lostItemId: lostItem.id,
                    foundItemId: foundItem.id,
                    title: notificationTitle,
                    message: notificationMessage,
                    matchScore: match.totalScore,
                },
            });
            const matchPayload = {
                notification: notificationRecord,
                score: match.totalScore,
                newItem,
                candidate,
                distanceMeters: match.distanceMeters,
            };
            matchedResults.push(matchPayload);
            // Emit real-time notification via Socket.io
            if (io) {
                // Direct to recipient user room
                io.to(`user_${notifyUserId}`).emit('match_alert', matchPayload);
                // Also broadcast general activity event
                io.emit('new_activity', {
                    type: 'MATCH',
                    message: `Match alert generated for "${newItem.title}"`,
                    timestamp: new Date(),
                });
            }
        }
    }
    return matchedResults;
}
