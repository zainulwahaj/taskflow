import { asyncHandler } from '../utils/asyncHandler.js';
import { Invitation } from '../models/Invitation.js';
import { BoardMember } from '../models/BoardMember.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { createActivity } from '../services/activityService.js';

export const acceptInvitation = asyncHandler(async (req, res) => {
  const boardId = req.params.boardId ?? req.params.id;
  const invId = req.params.invId;
  const inv = await Invitation.findOne({ _id: invId, boardId, status: 'pending' });
  if (!inv) throw new AppError('Invitation not found or already used', 404);
  const user = await User.findById(req.user._id);
  if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
    throw new AppError('This invitation was sent to a different email', 403);
  }
  const existing = await BoardMember.findOne({ boardId, userId: req.user._id });
  if (existing) {
    await Invitation.findByIdAndUpdate(invId, { status: 'accepted' });
    return res.json({ success: true, message: 'Already a member', boardId });
  }
  await BoardMember.create({
    boardId,
    userId: req.user._id,
    role: inv.role || 'member',
  });
  await Invitation.findByIdAndUpdate(invId, { status: 'accepted' });
  await createActivity({
    boardId,
    type: 'member_added',
    userId: req.user._id,
    metadata: { email: inv.email },
  });
  res.json({ success: true, boardId });
});

export const declineInvitation = asyncHandler(async (req, res) => {
  const boardId = req.params.boardId ?? req.params.id;
  const invId = req.params.invId;
  const inv = await Invitation.findOne({ _id: invId, boardId, status: 'pending' });
  if (!inv) throw new AppError('Invitation not found or already used', 404);
  const user = await User.findById(req.user._id);
  if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
    throw new AppError('This invitation was sent to a different email', 403);
  }
  await Invitation.findByIdAndUpdate(invId, { status: 'declined' });
  res.json({ success: true });
});

export const listMyInvitations = asyncHandler(async (req, res) => {
  const email = req.user.email.toLowerCase();
  const invitations = await Invitation.find({ email, status: 'pending' })
    .populate('boardId', 'title')
    .populate('inviterId', 'fullName')
    .sort({ createdAt: -1 })
    .lean();
  const list = invitations
    .filter((inv) => inv.boardId != null)
    .map((inv) => ({
      _id: inv._id,
      boardId: inv.boardId._id,
      boardTitle: inv.boardId?.title,
      inviterName: inv.inviterId?.fullName,
      email: inv.email,
      status: inv.status,
      createdAt: inv.createdAt,
    }));
  res.json({ success: true, invitations: list });
});
