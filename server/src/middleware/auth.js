import { verifyAccessToken } from '../services/tokenService.js';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken || null;
    if (!token) {
      throw new AppError('Authentication required', 401);
    }
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired token', 401));
      return;
    }
    next(err);
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies?.accessToken || null;
  if (!token) {
    return next();
  }
  verifyAccessToken(token)
    .then((decoded) => User.findById(decoded.userId))
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch(() => next());
}
