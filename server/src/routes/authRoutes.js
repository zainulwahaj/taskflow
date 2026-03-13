import { Router } from 'express';
import { register, login, logout, refresh } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema, refreshSchema } from '../validators/authValidators.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/logout', auth, asyncHandler(logout));
router.post('/refresh', validate(refreshSchema), asyncHandler(refresh));

export default router;
