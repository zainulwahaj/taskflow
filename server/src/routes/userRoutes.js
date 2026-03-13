import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { validate, updateProfileSchema } from '../validators/userValidators.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(auth);
router.get('/profile', asyncHandler(getProfile));
router.patch('/profile', validate(updateProfileSchema), asyncHandler(updateProfile));

export default router;
