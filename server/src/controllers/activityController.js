import { asyncHandler } from '../utils/asyncHandler.js';
import { Activity } from '../models/Activity.js';

export const listBoardActivity = asyncHandler(async (req, res) => {
  const boardId = req.params.id || req.params.boardId;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const activities = await Activity.find({ boardId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  const list = activities.map((a) => ({
    _id: a._id,
    type: a.type,
    userId: a.userId?._id,
    fullName: a.userId?.fullName,
    avatarUrl: a.userId?.avatarUrl,
    cardId: a.cardId,
    listId: a.listId,
    metadata: a.metadata,
    createdAt: a.createdAt,
  }));
  res.json({ success: true, activities: list });
});

export const listCardActivity = asyncHandler(async (req, res) => {
  const cardId = req.card._id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const activities = await Activity.find({ cardId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  const list = activities.map((a) => ({
    _id: a._id,
    type: a.type,
    userId: a.userId?._id,
    fullName: a.userId?.fullName,
    avatarUrl: a.userId?.avatarUrl,
    metadata: a.metadata,
    createdAt: a.createdAt,
  }));
  res.json({ success: true, activities: list });
});
