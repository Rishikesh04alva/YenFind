"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
exports.sanitizeAndSaveImage = sanitizeAndSaveImage;
exports.inspectImageExif = inspectImageExif;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const UPLOAD_DIR = path_1.default.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
// Ensure upload directory exists
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// Multer memory storage configuration (keeps raw buffer in RAM for sanitization)
const storage = multer_1.default.memoryStorage();
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 8 * 1024 * 1024, // 8MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and HEIC/HEIF images are supported.'));
        }
    },
});
/**
 * Strips EXIF metadata (GPS, camera tags, device info) and re-encodes as clean WebP.
 */
async function sanitizeAndSaveImage(buffer, originalName) {
    const hash = crypto_1.default.randomBytes(12).toString('hex');
    const timestamp = Date.now();
    const baseFilename = `${timestamp}-${hash}`;
    const fullImageFilename = `${baseFilename}-clean.webp`;
    const thumbFilename = `${baseFilename}-thumb.webp`;
    const fullImagePath = path_1.default.join(UPLOAD_DIR, fullImageFilename);
    const thumbImagePath = path_1.default.join(UPLOAD_DIR, thumbFilename);
    // 1. Process Main Image: Rotate for orientation, strip all EXIF/metadata, resize if too massive, convert to WebP
    const sanitizedFullBuffer = await (0, sharp_1.default)(buffer)
        .rotate() // Automatically rotate based on original orientation before stripping EXIF
        .resize({ width: 1440, height: 1440, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
    // 2. Process Thumbnail: Quick 320x320 crop
    const sanitizedThumbBuffer = await (0, sharp_1.default)(buffer)
        .rotate()
        .resize({ width: 360, height: 360, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    // 3. Write sanitized buffers to storage
    await fs_1.default.promises.writeFile(fullImagePath, sanitizedFullBuffer);
    await fs_1.default.promises.writeFile(thumbImagePath, sanitizedThumbBuffer);
    return {
        imageUrl: `/uploads/${fullImageFilename}`,
        thumbnailUrl: `/uploads/${thumbFilename}`,
        originalSize: buffer.length,
        sanitizedSize: sanitizedFullBuffer.length,
        exifStripped: true,
    };
}
/**
 * Helper to inspect EXIF metadata of any image buffer to verify sanitization
 */
async function inspectImageExif(buffer) {
    try {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        return {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            hasExif: !!metadata.exif,
            hasIcc: !!metadata.icc,
            hasIptc: !!metadata.iptc,
            hasXmp: !!metadata.xmp,
        };
    }
    catch (err) {
        return { error: 'Failed to inspect metadata' };
    }
}
