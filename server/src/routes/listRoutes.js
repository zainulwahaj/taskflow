import { Router } from 'express';
import { createList, updateList, deleteList } from '../controllers/listController.js';
import { createCard } from '../controllers/cardController.js';
import { createCardSchema } from '../validators/cardValidators.js';
import { validate, createListSchema, updateListSchema } from '../validators/listValidators.js';
import { auth } from '../middleware/auth.js';
import { listAccess } from '../middleware/boardAccess.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);

router.patch('/:id', listAccess(), validate(updateListSchema), asyncHandler(updateList));
router.delete('/:id', listAccess(), asyncHandler(deleteList));
router.post('/:id/cards', listAccess(), validate(createCardSchema), asyncHandler(createCard));

export default router;
