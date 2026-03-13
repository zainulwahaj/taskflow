import { Router } from 'express';
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  starBoard,
  unstarBoard,
  listMembers,
  inviteMember,
  updateMember,
  removeMember,
  searchCards,
} from '../controllers/boardController.js';
import { listBoardActivity } from '../controllers/activityController.js';
import {
  listLists,
  createList,
  reorderLists,
} from '../controllers/listController.js';
import { acceptInvitation, declineInvitation } from '../controllers/invitationController.js';
import {
  validate,
  createBoardSchema,
  updateBoardSchema,
  inviteMemberSchema,
  updateMemberSchema,
} from '../validators/boardValidators.js';
import { createListSchema, reorderListsSchema, validate as validateList } from '../validators/listValidators.js';
import { auth } from '../middleware/auth.js';
import { boardAccess, requireOwner, requireAdminOrOwner } from '../middleware/boardAccess.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);

router.get('/', asyncHandler(listBoards));
router.post('/', validate(createBoardSchema), asyncHandler(createBoard));

router.post('/:id/invitations/:invId/accept', asyncHandler(acceptInvitation));
router.post('/:id/invitations/:invId/decline', asyncHandler(declineInvitation));

router.get('/:id', boardAccess(), asyncHandler(getBoard));
router.patch('/:id', boardAccess(), validate(updateBoardSchema), asyncHandler(updateBoard));
router.delete('/:id', boardAccess(), requireOwner, asyncHandler(deleteBoard));

router.post('/:id/star', boardAccess(), asyncHandler(starBoard));
router.delete('/:id/star', boardAccess(), asyncHandler(unstarBoard));

router.get('/:id/members', boardAccess(), asyncHandler(listMembers));
router.post('/:id/members/invite', boardAccess(), requireAdminOrOwner, validate(inviteMemberSchema), asyncHandler(inviteMember));
router.patch('/:id/members/:userId', boardAccess(), requireAdminOrOwner, validate(updateMemberSchema), asyncHandler(updateMember));
router.delete('/:id/members/:userId', boardAccess(), asyncHandler(removeMember));

router.get('/:id/lists', boardAccess(), asyncHandler(listLists));
router.post('/:id/lists', boardAccess(), validateList(createListSchema), asyncHandler(createList));
router.post('/:id/lists/reorder', boardAccess(), validateList(reorderListsSchema), asyncHandler(reorderLists));

router.get('/:id/activity', boardAccess(), asyncHandler(listBoardActivity));
router.get('/:id/cards/search', boardAccess(), asyncHandler(searchCards));

export default router;
