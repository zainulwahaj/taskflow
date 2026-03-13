import bcrypt from 'bcrypt';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user.toObject();
  delete user.passwordHash;
  res.json({ success: true, user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, avatarUrl, currentPassword, newPassword } = req.validated.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (fullName !== undefined) user.fullName = fullName;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 400);
    user.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  await user.save();
  const out = user.toObject();
  delete out.passwordHash;
  res.json({ success: true, user: out });
});
