import { asyncHandler } from '../utils/asyncHandler.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { AppError } from '../middleware/errorHandler.js';
import { createActivity } from '../services/activityService.js';

export const listLists = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const lists = await List.find({ boardId }).sort({ order: 1 }).lean();
  const listIds = lists.map((l) => l._id);
  const cards = await Card.find({ listId: { $in: listIds } }).sort({ order: 1 }).lean();
  const cardsByList = {};
  listIds.forEach((id) => { cardsByList[id.toString()] = []; });
  cards.forEach((c) => {
    const key = c.listId?.toString?.() || c.listId;
    if (cardsByList[key]) cardsByList[key].push(c);
  });
  const listsWithCards = lists.map((l) => ({
    ...l,
    cards: cardsByList[l._id.toString()] || [],
  }));
  res.json({ success: true, lists: listsWithCards });
});

export const createList = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const { title, order } = req.validated.body;
  const maxOrder = await List.findOne({ boardId }).sort({ order: -1 }).select('order').lean();
  const nextOrder = (maxOrder?.order ?? -1) + 1;
  const list = await List.create({
    boardId,
    title: title.trim(),
    order: order ?? nextOrder,
  });
  await createActivity({
    boardId,
    type: 'list_created',
    userId: req.user._id,
    listId: list._id,
    metadata: { title: list.title },
  });
  res.status(201).json({ success: true, list });
});

export const updateList = asyncHandler(async (req, res) => {
  const list = req.list;
  const { title, order } = req.validated.body;
  if (title !== undefined) list.title = title.trim();
  if (order !== undefined) list.order = order;
  await list.save();
  res.json({ success: true, list });
});

export const deleteList = asyncHandler(async (req, res) => {
  const listId = req.list._id;
  await Card.deleteMany({ listId });
  await List.findByIdAndDelete(listId);
  res.json({ success: true });
});

export const reorderLists = asyncHandler(async (req, res) => {
  const boardId = req.boardId;
  const { listIds } = req.validated.body;
  if (!Array.isArray(listIds) || listIds.length === 0) {
    throw new AppError('listIds array required', 400);
  }
  const lists = await List.find({ boardId, _id: { $in: listIds } });
  if (lists.length !== listIds.length) {
    throw new AppError('Some lists not found or access denied', 400);
  }
  const updates = listIds.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
  }));
  await List.bulkWrite(updates);
  const updated = await List.find({ boardId }).sort({ order: 1 }).lean();
  res.json({ success: true, lists: updated });
});
