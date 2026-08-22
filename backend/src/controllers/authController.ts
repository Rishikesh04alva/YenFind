import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { isValidEduEmail, AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-campus-lost-found-secret-key-2026';

export async function loginWithEduEmail(req: Request, res: Response) {
  try {
    const { email, name, campusName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Campus .edu email address is required.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Security Gate: Strict .edu validation
    if (!isValidEduEmail(trimmedEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Only verified .edu email addresses are permitted on this campus portal (e.g. student@yenepoya.edu.in, name@harvard.edu).',
      });
    }

    const userName = name?.trim() || trimmedEmail.split('@')[0].replace('.', ' ');
    const campus = campusName?.trim() || 'Yenepoya School of Engineering & Technology, Balmatta';

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { email: trimmedEmail },
      update: {
        name: userName,
        campusName: campus,
      },
      create: {
        email: trimmedEmail,
        name: userName,
        campusName: campus,
        role: trimmedEmail.includes('admin') ? 'ADMIN' : 'STUDENT',
      },
    });

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      campusName: user.campusName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Successfully authenticated with campus credentials.',
      token,
      user: {
        ...tokenPayload,
        points: user.points,
        itemsReturned: user.itemsReturned,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication service encountered an unexpected error.',
    });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: {
            items: true,
            claims: true,
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        campusName: user.campusName,
        points: user.points,
        itemsReturned: user.itemsReturned,
        itemCount: user._count.items,
        claimCount: user._count.claims,
        unreadNotifications: user._count.notifications,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
}
