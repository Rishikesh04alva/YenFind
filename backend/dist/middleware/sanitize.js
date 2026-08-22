"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const sanitizeOptions = {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
};
function deepSanitize(target) {
    if (typeof target === 'string') {
        return (0, sanitize_html_1.default)(target.trim(), sanitizeOptions);
    }
    if (Array.isArray(target)) {
        return target.map(deepSanitize);
    }
    if (target !== null && typeof target === 'object') {
        const sanitizedObj = {};
        for (const key of Object.keys(target)) {
            sanitizedObj[key] = deepSanitize(target[key]);
        }
        return sanitizedObj;
    }
    return target;
}
function sanitizeInput(req, res, next) {
    if (req.body) {
        req.body = deepSanitize(req.body);
    }
    if (req.query) {
        req.query = deepSanitize(req.query);
    }
    if (req.params) {
        req.params = deepSanitize(req.params);
    }
    next();
}
