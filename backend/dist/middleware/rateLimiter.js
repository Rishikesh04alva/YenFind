"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimLimiter = exports.createItemLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Standard API rate limiter: 150 requests per 15 minutes per IP
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests from this IP address. Please try again after 15 minutes.',
    },
});
// Strict Auth limiter: 20 requests per 15 minutes
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    },
});
// Item Creation Limiter: 15 posts per 15 minutes to prevent spam
exports.createItemLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'You have submitted several reports recently. Please wait a few moments before posting again.',
    },
});
// Claim Limiter: 10 claims per 15 minutes
exports.claimLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Claim submission limit reached. Please wait before submitting additional claims.',
    },
});
