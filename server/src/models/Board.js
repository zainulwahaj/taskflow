import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    backgroundColor: {
      type: String,
      default: '#0f766e',
    },
    visibility: {
      type: String,
      enum: ['private', 'workspace'],
      default: 'private',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

boardSchema.index({ ownerId: 1 });
boardSchema.index({ updatedAt: -1 });

export const Board = mongoose.model('Board', boardSchema);
