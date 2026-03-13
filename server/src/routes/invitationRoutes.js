import { Router } from 'express';
import { listMyInvitations } from '../controllers/invitationController.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);
router.get('/me', asyncHandler(listMyInvitations));

export default router;
