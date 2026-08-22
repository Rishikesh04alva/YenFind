import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer memory storage configuration (keeps raw buffer in RAM for sanitization)
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and HEIC/HEIF images are supported.'));
    }
  },
});

export interface ProcessedImageResult {
  imageUrl: string;
  thumbnailUrl: string;
  originalSize: number;
  sanitizedSize: number;
  exifStripped: boolean;
}

/**
 * Strips EXIF metadata (GPS, camera tags, device info) and re-encodes as clean WebP.
 */
export async function sanitizeAndSaveImage(
  buffer: Buffer,
  originalName: string
): Promise<ProcessedImageResult> {
  const hash = crypto.randomBytes(12).toString('hex');
  const timestamp = Date.now();
  const baseFilename = `${timestamp}-${hash}`;
  const fullImageFilename = `${baseFilename}-clean.webp`;
  const thumbFilename = `${baseFilename}-thumb.webp`;

  const fullImagePath = path.join(UPLOAD_DIR, fullImageFilename);
  const thumbImagePath = path.join(UPLOAD_DIR, thumbFilename);

  // 1. Process Main Image: Rotate for orientation, strip all EXIF/metadata, resize if too massive, convert to WebP
  const sanitizedFullBuffer = await sharp(buffer)
    .rotate() // Automatically rotate based on original orientation before stripping EXIF
    .resize({ width: 1440, height: 1440, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  // 2. Process Thumbnail: Quick 320x320 crop
  const sanitizedThumbBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 360, height: 360, fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  // 3. Write sanitized buffers to storage
  await fs.promises.writeFile(fullImagePath, sanitizedFullBuffer);
  await fs.promises.writeFile(thumbImagePath, sanitizedThumbBuffer);

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
export async function inspectImageExif(buffer: Buffer): Promise<Record<string, any>> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      hasExif: !!metadata.exif,
      hasIcc: !!metadata.icc,
      hasIptc: !!metadata.iptc,
      hasXmp: !!metadata.xmp,
    };
  } catch (err) {
    return { error: 'Failed to inspect metadata' };
  }
}
