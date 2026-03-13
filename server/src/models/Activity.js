import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activitySchema.index({ boardId: 1, createdAt: -1 });
activitySchema.index({ cardId: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
