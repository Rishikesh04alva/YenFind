"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEduEmail = isValidEduEmail;
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-campus-lost-found-secret-key-2026';
/**
 * Validates that an email strictly belongs to an educational institution domain (.edu or .edu.in)
 */
function isValidEduEmail(email) {
    if (!email || typeof email !== 'string')
        return false;
    const trimmed = email.trim().toLowerCase();
    // Standard regex ensuring valid format ending in .edu or .edu.in
    const eduRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|edu\.in)$/;
    return eduRegex.test(trimmed);
}
/**
 * JWT Authentication Middleware
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication token required. Please sign in with your .edu campus account.',
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Validate domain integrity
        if (!isValidEduEmail(decoded.email)) {
            return res.status(403).json({
                success: false,
                error: 'Access Denied: Your account email is not an authorized .edu address.',
            });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired session token. Please re-authenticate.',
        });
    }
}
/**
 * Optional Auth - populates req.user if token is valid, but allows unauthenticated browsing
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (isValidEduEmail(decoded.email)) {
                req.user = decoded;
            }
        }
        catch {
            // Ignored for optional auth
        }
    }
    next();
}
