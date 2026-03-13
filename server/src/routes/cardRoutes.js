import { Router } from 'express';
import {
  getCard,
  updateCard,
  deleteCard,
  getBoardMembersForCard,
} from '../controllers/cardController.js';
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import { listCardActivity } from '../controllers/activityController.js';
import { validate, updateCardSchema } from '../validators/cardValidators.js';
import { validate as validateComment, createCommentSchema, updateCommentSchema } from '../validators/commentValidators.js';
import { auth } from '../middleware/auth.js';
import { cardAccess } from '../middleware/boardAccess.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);

router.get('/:id', cardAccess(), asyncHandler(getCard));
router.patch('/:id', cardAccess(), validate(updateCardSchema), asyncHandler(updateCard));
router.delete('/:id', cardAccess(), asyncHandler(deleteCard));
router.get('/:id/members', cardAccess(), asyncHandler(getBoardMembersForCard));
router.get('/:id/activity', cardAccess(), asyncHandler(listCardActivity));

router.get('/:id/comments', cardAccess(), asyncHandler(listComments));
router.post('/:id/comments', cardAccess(), validateComment(createCommentSchema), asyncHandler(createComment));
router.patch('/:id/comments/:commentId', cardAccess(), validateComment(updateCommentSchema), asyncHandler(updateComment));
router.delete('/:id/comments/:commentId', cardAccess(), asyncHandler(deleteComment));

export default router;
