import { asyncHandler } from '../utils/asyncHandler.js';
import { Comment } from '../models/Comment.js';
import { AppError } from '../middleware/errorHandler.js';
import { createActivity } from '../services/activityService.js';

export const listComments = asyncHandler(async (req, res) => {
  const cardId = req.card._id;
  const comments = await Comment.find({ cardId })
    .sort({ createdAt: 1 })
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  const list = comments.map((c) => ({
    _id: c._id,
    text: c.text,
    userId: c.userId?._id,
    fullName: c.userId?.fullName,
    email: c.userId?.email,
    avatarUrl: c.userId?.avatarUrl,
    createdAt: c.createdAt,
  }));
  res.json({ success: true, comments: list });
});

export const createComment = asyncHandler(async (req, res) => {
  const card = req.card;
  const { text } = req.validated.body;
  const comment = await Comment.create({
    cardId: card._id,
    userId: req.user._id,
    text: text.trim(),
  });
  await createActivity({
    boardId: card.boardId,
    type: 'commented',
    userId: req.user._id,
    cardId: card._id,
    metadata: { commentId: comment._id, textPreview: text.trim().slice(0, 80) },
  });
  const populated = await Comment.findById(comment._id)
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  res.status(201).json({
    success: true,
    comment: {
      _id: populated._id,
      text: populated.text,
      userId: populated.userId?._id,
      fullName: populated.userId?.fullName,
      email: populated.userId?.email,
      avatarUrl: populated.userId?.avatarUrl,
      createdAt: populated.createdAt,
    },
  });
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Only the author can edit this comment', 403);
  }
  comment.text = req.validated.body.text.trim();
  await comment.save();
  const populated = await Comment.findById(comment._id)
    .populate('userId', 'fullName email avatarUrl')
    .lean();
  res.json({
    success: true,
    comment: {
      _id: populated._id,
      text: populated.text,
      userId: populated.userId?._id,
      fullName: populated.userId?.fullName,
      email: populated.userId?.email,
      avatarUrl: populated.userId?.avatarUrl,
      createdAt: populated.createdAt,
    },
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Only the author can delete this comment', 403);
  }
  await Comment.findByIdAndDelete(comment._id);
  res.json({ success: true });
});
