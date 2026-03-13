import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.validated.body;
  const { user, accessToken, refreshToken } = await authService.registerUser({
    email,
    password,
    fullName,
  });
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
  });
  res.status(201).json({
    success: true,
    user,
    accessToken,
    expiresIn: 900,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const { user, accessToken, refreshToken } = await authService.loginUser({
    email,
    password,
  });
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
  });
  res.json({
    success: true,
    user,
    accessToken,
    expiresIn: 900,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    maxAge: 0,
  });
  res.json({ success: true });
});

export const refresh = asyncHandler(async (req, res) => {
  const token =
    req.validated?.body?.refreshToken ||
    req.cookies?.refreshToken;
  if (!token) {
    throw new AppError('Refresh token required', 401);
  }
  const { user, accessToken, refreshToken: newRefresh } =
    await authService.refreshUserTokens(token);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', newRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
  });
  res.json({
    success: true,
    user,
    accessToken,
    expiresIn: 900,
  });
});
