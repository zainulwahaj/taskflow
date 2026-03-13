import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const cardSchema = new mongoose.Schema(
  {
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    assignedMemberIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    labels: [{
      type: String,
      trim: true,
      maxlength: 50,
    }],
    checklist: [checklistItemSchema],
  },
  { timestamps: true }
);

cardSchema.index({ listId: 1, order: 1 });
cardSchema.index({ boardId: 1 });

export const Card = mongoose.model('Card', cardSchema);
