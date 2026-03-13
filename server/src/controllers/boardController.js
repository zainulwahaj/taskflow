import { asyncHandler } from '../utils/asyncHandler.js';
import { Board } from '../models/Board.js';
import { BoardMember } from '../models/BoardMember.js';
import { User } from '../models/User.js';
import { Invitation } from '../models/Invitation.js';
import { Card } from '../models/Card.js';
import { List } from '../models/List.js';
import { Comment } from '../models/Comment.js';
import { Activity } from '../models/Activity.js';
import { AppError } from '../middleware/errorHandler.js';
import { createActivity } from '../services/activityService.js';

export const listBoards = asyncHandler(async (req, res) => {
  const memberships = await BoardMember.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('boardId')
    .lean();
  const boards = memberships
    .filter((m) => m.boardId)
    .map((m) => ({ ...m.boardId, membership: { role: m.role, starred: m.starred } }));
  const starred = boards.filter((b) => b.membership?.starred);
  const recent = boards.slice(0, 8);
  const shared = boards.filter((b) => b.membership?.role !== 'owner');
  res.json({
    success: true,
    boards,
    recent,
    starred,
    shared,
  });
});

export const createBoard = asyncHandler(async (req, res) => {
  const { title, description, backgroundColor, visibility } = req.validated.body;
  const board = await Board.create({
    title: title.trim(),
    description: (description || '').trim(),
    backgroundColor: backgroundColor || '#0f766e',
    visibility: visibility || 'private',
    ownerId: req.user._id,
  });
  await BoardMember.create({
    boardId: board._id,
    userId: req.user._id,
    role: 'owner',
  });
  await createActivity({
    boardId: board._id,
    type: 'board_created',
    userId: req.user._id,
    metadata: { title: board.title },
  });
  const populated = await Board.findById(board._id).lean();
  res.status(201).json({ success: true, board: { ...populated, membership: { role: 'owner', starred: false } } });
});

export const getBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const board = await Board.findById(boardId).lean();
  if (!board) throw new AppError('Board not found', 404);
  const membership = await BoardMember.findOne({
    boardId,
    userId: req.user._id,
  }).lean();
  if (!membership) throw new AppError('Access denied to this board', 403);
  res.json({
    success: true,
    board: { ...board, membership: { role: membership.role, starred: membership.starred } },
  });
});

export const updateBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const { title, description, backgroundColor, visibility } = req.validated.body;
  const board = await Board.findByIdAndUpdate(
    boardId,
    {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(backgroundColor !== undefined && { backgroundColor }),
      ...(visibility !== undefined && { visibility }),
    },
    { new: true, runValidators: true }
  ).lean();
  if (!board) throw new AppError('Board not found', 404);
  const membership = await BoardMember.findOne({ boardId, userId: req.user._id }).lean();
  res.json({
    success: true,
    board: { ...board, membership: membership ? { role: membership.role, starred: membership.starred } : null },
  });
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);
  const membership = await BoardMember.findOne({ boardId, userId: req.user._id });
  if (!membership || membership.role !== 'owner') {
    throw new AppError('Only the board owner can delete this board', 403);
  }
  const cardIds = await Card.find({ boardId }).distinct('_id');
  await Comment.deleteMany({ cardId: { $in: cardIds } });
  await Activity.deleteMany({ boardId });
  await Card.deleteMany({ boardId });
  await List.deleteMany({ boardId });
  await BoardMember.deleteMany({ boardId });
  await Invitation.deleteMany({ boardId });
  await Board.findByIdAndDelete(boardId);
  res.json({ success: true });
});

export const starBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const member = await BoardMember.findOneAndUpdate(
    { boardId, userId: req.user._id },
    { starred: true },
    { new: true }
  );
  if (!member) throw new AppError('Board not found or access denied', 404);
  res.json({ success: true, starred: true });
});

export const unstarBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  await BoardMember.findOneAndUpdate(
    { boardId, userId: req.user._id },
    { starred: false }
  );
  res.json({ success: true, starred: false });
});

export const listMembers = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const members = await BoardMember.find({ boardId })
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  const list = members.map((m) => ({
    _id: m._id,
    userId: m.userId?._id,
    fullName: m.userId?.fullName,
    email: m.userId?.email,
    avatarUrl: m.userId?.avatarUrl,
    role: m.role,
  }));
  res.json({ success: true, members: list });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const { email, role: inviteRole } = req.validated.body;
  const normalizedEmail = email.toLowerCase().trim();
  const board = await Board.findById(boardId);
  if (!board) throw new AppError('Board not found', 404);
  const existingMember = await BoardMember.findOne({ boardId, userId: (await User.findOne({ email: normalizedEmail }))?._id });
  if (existingMember) throw new AppError('User is already a member', 400);
  const existingInvite = await Invitation.findOne({ boardId, email: normalizedEmail, status: 'pending' });
  if (existingInvite) throw new AppError('Invitation already sent to this email', 400);
  const role = inviteRole || 'member';
  const inv = await Invitation.create({
    boardId,
    email: normalizedEmail,
    inviterId: req.user._id,
    status: 'pending',
    role,
  });
  const inviter = await User.findById(req.user._id).select('fullName').lean();
  res.status(201).json({
    success: true,
    invitation: {
      _id: inv._id,
      email: inv.email,
      status: inv.status,
      inviterName: inviter?.fullName,
    },
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const { userId: targetUserId } = req.params;
  const { role } = req.validated?.body || {};
  const targetMember = await BoardMember.findOne({ boardId, userId: targetUserId });
  if (!targetMember) throw new AppError('Member not found', 404);
  const me = await BoardMember.findOne({ boardId, userId: req.user._id });
  if (me.role !== 'owner' && me.role !== 'admin') {
    throw new AppError('Insufficient permissions', 403);
  }
  if (targetMember.role === 'owner') {
    throw new AppError('Cannot change owner role', 403);
  }
  if (role) targetMember.role = role;
  await targetMember.save();
  const populated = await BoardMember.findById(targetMember._id)
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  res.json({
    success: true,
    member: {
      _id: populated._id,
      userId: populated.userId?._id,
      fullName: populated.userId?.fullName,
      email: populated.userId?.email,
      avatarUrl: populated.userId?.avatarUrl,
      role: populated.role,
    },
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const { userId: targetUserId } = req.params;
  const targetMember = await BoardMember.findOne({ boardId, userId: targetUserId });
  if (!targetMember) throw new AppError('Member not found', 404);
  if (targetMember.role === 'owner') {
    throw new AppError('Cannot remove the board owner', 403);
  }
  const me = await BoardMember.findOne({ boardId, userId: req.user._id });
  if (me.role !== 'owner' && me.role !== 'admin' && !targetMember.userId.equals(req.user._id)) {
    throw new AppError('Insufficient permissions', 403);
  }
  await BoardMember.findByIdAndDelete(targetMember._id);
  res.json({ success: true });
});

export const searchCards = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const { q, assignee, dueDate, priority, label, completed } = req.query;
  const filter = { boardId };
  if (q && q.trim()) {
    filter.title = { $regex: q.trim(), $options: 'i' };
  }
  if (assignee) filter.assignedMemberIds = assignee;
  if (priority) filter.priority = priority;
  if (label) filter.labels = label;
  if (completed !== undefined && completed !== '') {
    filter.completed = completed === 'true' || completed === '1';
  }
  if (dueDate) {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      filter.dueDate = { $gte: start, $lte: end };
    }
  }
  const cards = await Card.find(filter)
    .populate('assignedMemberIds', 'fullName email avatarUrl')
    .populate('listId', 'title')
    .sort({ order: 1 })
    .limit(100)
    .lean();
  res.json({ success: true, cards });
});
