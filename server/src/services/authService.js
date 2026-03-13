import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './tokenService.js';

const SALT_ROUNDS = 12;

export async function registerUser({ email, password, fullName }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 400);
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    fullName: fullName.trim(),
  });
  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  const accessToken = generateAccessToken({ userId: user._id.toString() });
  const refreshToken = generateRefreshToken({ userId: user._id.toString() });
  return { user: safeUser, accessToken, refreshToken };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }
  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  const accessToken = generateAccessToken({ userId: user._id.toString() });
  const refreshToken = generateRefreshToken({ userId: user._id.toString() });
  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshUserTokens(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError('User not found', 401);
  }
  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  const accessToken = generateAccessToken({ userId: user._id.toString() });
  const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });
  return { user: safeUser, accessToken, refreshToken: newRefreshToken };
}
