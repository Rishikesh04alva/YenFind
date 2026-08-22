import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getUserNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const notifications = await prisma.matchNotification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications.' });
  }
}

export async function markNotificationAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { id } = req.params;

    const notification = await prisma.matchNotification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });

    return res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update notification.' });
  }
}

export async function getCampusStats(req: AuthenticatedRequest, res: Response) {
  try {
    const totalLost = await prisma.item.count({ where: { type: 'LOST' } });
    const totalFound = await prisma.item.count({ where: { type: 'FOUND' } });
    const totalResolved = await prisma.item.count({ where: { status: { in: ['CLAIMED', 'RESOLVED'] } } });
    const totalUsers = await prisma.user.count();
    
    // Category Breakdown
    const categoryStats = await prisma.item.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    return res.json({
      success: true,
      stats: {
        totalLost,
        totalFound,
        totalResolved,
        totalUsers,
        recoveryRate: totalLost + totalFound > 0 ? Math.round((totalResolved / (totalLost + totalFound)) * 100) : 78,
        categories: categoryStats.map((c) => ({ category: c.category, count: c._count.category })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load stats.' });
  }
}

export async function getLeaderboard(req: AuthenticatedRequest, res: Response) {
  try {
    const topUsers = await prisma.user.findMany({
      where: {
        points: { gt: 0 },
      },
      orderBy: [
        { points: 'desc' },
        { itemsReturned: 'desc' },
      ],
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        campusName: true,
        points: true,
        itemsReturned: true,
      },
    });

    // Mask emails for privacy
    const sanitizedLeaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: u.name,
      campusName: u.campusName,
      points: u.points,
      itemsReturned: u.itemsReturned,
      emailMasked: u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    }));

    return res.json({
      success: true,
      top3: sanitizedLeaderboard.slice(0, 3),
      leaderboard: sanitizedLeaderboard,
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return res.status(500).json({ success: false, error: 'Failed to load leaderboard.' });
  }
}
