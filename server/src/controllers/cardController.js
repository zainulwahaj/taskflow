import { asyncHandler } from '../utils/asyncHandler.js';
import { Card } from '../models/Card.js';
import { List } from '../models/List.js';
import { BoardMember } from '../models/BoardMember.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { createActivity } from '../services/activityService.js';

export const createCard = asyncHandler(async (req, res) => {
  const list = req.list;
  const { title, description, order } = req.validated.body;
  const maxOrder = await Card.findOne({ listId: list._id }).sort({ order: -1 }).select('order').lean();
  const nextOrder = (order ?? (maxOrder?.order ?? -1) + 1);
  const card = await Card.create({
    listId: list._id,
    boardId: list.boardId,
    title: title.trim(),
    description: (description || '').trim(),
    order: nextOrder,
  });
  await createActivity({
    boardId: list.boardId,
    type: 'card_created',
    userId: req.user._id,
    cardId: card._id,
    listId: list._id,
    metadata: { title: card.title },
  });
  const populated = await Card.findById(card._id)
    .populate('assignedMemberIds', 'fullName email avatarUrl')
    .lean();
  res.status(201).json({ success: true, card: populated });
});

export const getCard = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.card._id)
    .populate('assignedMemberIds', 'fullName email avatarUrl')
    .lean();
  if (!card) throw new AppError('Card not found', 404);
  res.json({ success: true, card });
});

export const updateCard = asyncHandler(async (req, res) => {
  const card = req.card;
  const body = req.validated.body;
  const allowed = [
    'title', 'description', 'order', 'listId', 'dueDate', 'priority',
    'completed', 'assignedMemberIds', 'labels', 'checklist',
  ];
  if (body.assignedMemberIds !== undefined) {
    const memberIds = await BoardMember.find({ boardId: card.boardId }).distinct('userId');
    const idSet = new Set(memberIds.map((mid) => mid.toString()));
    const validIds = Array.isArray(body.assignedMemberIds)
      ? body.assignedMemberIds.map((id) => (id != null ? String(id) : null)).filter((id) => id && idSet.has(id))
      : [];
    card.assignedMemberIds = validIds;
  }
  allowed.forEach((key) => {
    if (key === 'assignedMemberIds') return;
    if (body[key] !== undefined) {
      if (key === 'dueDate') card[key] = body[key] ? new Date(body[key]) : null;
      else card[key] = body[key];
    }
  });
  const previousListId = card.listId?.toString();
  if (body.listId && body.listId !== previousListId) {
    const targetList = await List.findById(body.listId);
    if (!targetList || targetList.boardId.toString() !== card.boardId.toString()) {
      throw new AppError('Target list not found or not on same board', 400);
    }
    card.listId = targetList._id;
    await createActivity({
      boardId: card.boardId,
      type: 'card_moved',
      userId: req.user._id,
      cardId: card._id,
      listId: targetList._id,
      metadata: { fromListId: previousListId, toListId: targetList._id.toString(), title: card.title },
    });
  }
  await card.save();

  async function normalizeListOrder(listId) {
    const cardsInList = await Card.find({ listId }).sort({ order: 1 });
    await Promise.all(
      cardsInList.map((c, i) => Card.findByIdAndUpdate(c._id, { order: i }))
    );
  }
  await normalizeListOrder(card.listId);
  if (previousListId && previousListId !== card.listId.toString()) {
    await normalizeListOrder(previousListId);
  }
  const populated = await Card.findById(card._id)
    .populate('assignedMemberIds', 'fullName email avatarUrl')
    .lean();
  res.json({ success: true, card: populated });
});

export const deleteCard = asyncHandler(async (req, res) => {
  await Card.findByIdAndDelete(req.card._id);
  res.json({ success: true });
});

export const moveCard = asyncHandler(async (req, res) => {
  const card = req.card;
  const { listId, order } = req.validated.body;
  const targetList = await List.findById(listId);
  if (!targetList || targetList.boardId.toString() !== card.boardId.toString()) {
    throw new AppError('Target list not found or not on same board', 400);
  }
  card.listId = targetList._id;
  if (typeof order === 'number') card.order = order;
  await card.save();
  const populated = await Card.findById(card._id)
    .populate('assignedMemberIds', 'fullName email avatarUrl')
    .lean();
  res.json({ success: true, card: populated });
});

export const getBoardMembersForCard = asyncHandler(async (req, res) => {
  const boardId = req.card.boardId;
  const members = await BoardMember.find({ boardId })
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  const list = members.map((m) => ({
    userId: m.userId?._id,
    fullName: m.userId?.fullName,
    email: m.userId?.email,
    avatarUrl: m.userId?.avatarUrl,
  })).filter((m) => m.userId);
  res.json({ success: true, members: list });
});
