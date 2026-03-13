import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import boardRoutes from './boardRoutes.js';
import invitationRoutes from './invitationRoutes.js';
import listRoutes from './listRoutes.js';
import cardRoutes from './cardRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/boards', boardRoutes);
router.use('/invitations', invitationRoutes);
router.use('/lists', listRoutes);
router.use('/cards', cardRoutes);

export default router;
