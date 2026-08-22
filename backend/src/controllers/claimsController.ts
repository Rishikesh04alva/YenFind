import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { Server as SocketIOServer } from 'socket.io';

export async function submitClaim(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required to file a claim.' });
    }

    const { itemId, proofDescription, verificationAnswer } = req.body;

    if (!itemId || !proofDescription) {
      return res.status(400).json({ success: false, error: 'Item ID and proof description are required.' });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { user: true },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found.' });
    }

    if (item.userId === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot claim an item you posted.' });
    }

    // Check if user already submitted an active claim
    const existingClaim = await prisma.claim.findFirst({
      where: {
        itemId,
        claimantId: req.user.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingClaim) {
      return res.status(400).json({ success: false, error: 'You already have an active claim on this item.' });
    }

    const claim = await prisma.claim.create({
      data: {
        itemId,
        claimantId: req.user.id,
        proofDescription: proofDescription.trim(),
        verificationAnswer: verificationAnswer?.trim() || null,
        status: 'PENDING',
      },
      include: {
        claimant: {
          select: { id: true, name: true, email: true },
        },
        item: true,
      },
    });

    // Notify item poster via Socket.io
    const io: SocketIOServer | undefined = req.app.get('io');
    if (io) {
      io.to(`user_${item.userId}`).emit('new_claim', {
        claim,
        itemTitle: item.title,
        message: `${req.user.name} submitted a claim for "${item.title}".`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Claim successfully submitted. The item poster has been alerted.',
      claim,
    });
  } catch (error) {
    console.error('Error submitting claim:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit claim.' });
  }
}

export async function reviewClaim(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { claimId } = req.params;
    const { status } = req.body; // "APPROVED" | "REJECTED"

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true, claimant: true },
    });

    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found.' });
    }

    // Only owner of item can approve/reject
    if (claim.item.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only the item poster can review this claim.' });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: claimId },
      data: { status },
    });

    // If approved, update item status to CLAIMED
    if (status === 'APPROVED') {
      await prisma.item.update({
        where: { id: claim.itemId },
        data: { status: 'CLAIMED' },
      });
    }

    const io: SocketIOServer | undefined = req.app.get('io');
    if (io) {
      io.to(`user_${claim.claimantId}`).emit('claim_status_updated', {
        claimId: claim.id,
        status,
        itemTitle: claim.item.title,
      });
    }

    return res.json({ success: true, claim: updatedClaim });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to review claim.' });
  }
}

export async function sendItemMessage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { itemId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Message text cannot be empty.' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found.' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        itemId,
        senderId: req.user.id,
        text: text.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const io: SocketIOServer | undefined = req.app.get('io');
    if (io) {
      io.to(`item_${itemId}`).emit('new_message', message);
    }

    return res.status(201).json({ success: true, message });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
}
