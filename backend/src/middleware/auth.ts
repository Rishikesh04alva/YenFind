import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-campus-lost-found-secret-key-2026';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  campusName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

/**
 * Validates that an email strictly belongs to an educational institution domain (.edu or .edu.in)
 */
export function isValidEduEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  
  // Standard regex ensuring valid format ending in .edu or .edu.in
  const eduRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|edu\.in)$/;
  return eduRegex.test(trimmed);
}

/**
 * JWT Authentication Middleware
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required. Please sign in with your .edu campus account.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    
    // Validate domain integrity
    if (!isValidEduEmail(decoded.email)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Your account email is not an authorized .edu address.',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired session token. Please re-authenticate.',
    });
  }
}

/**
 * Optional Auth - populates req.user if token is valid, but allows unauthenticated browsing
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      if (isValidEduEmail(decoded.email)) {
        req.user = decoded;
      }
    } catch {
      // Ignored for optional auth
    }
  }
  next();
}
