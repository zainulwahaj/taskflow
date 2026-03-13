import { BoardMember } from '../models/BoardMember.js';
import { Board } from '../models/Board.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { AppError } from './errorHandler.js';

const ROLES = ['owner', 'admin', 'member'];

async function checkBoardMembership(req, boardId) {
  const membership = await BoardMember.findOne({
    boardId,
    userId: req.user._id,
  });
  if (!membership) {
    const board = await Board.findById(boardId);
    if (!board) throw new AppError('Board not found', 404);
    throw new AppError('Access denied to this board', 403);
  }
  req.boardMember = membership;
  req.boardId = boardId;
  return membership;
}

export function listAccess(allowedRoles = ROLES) {
  return async (req, res, next) => {
    try {
      const listId = req.params.listId ?? req.params.id;
      if (!listId) throw new AppError('List ID required', 400);
      const list = await List.findById(listId);
      if (!list) throw new AppError('List not found', 404);
      req.list = list;
      await checkBoardMembership(req, list.boardId.toString());
      const hasRole = allowedRoles.includes(req.boardMember.role);
      if (!hasRole) throw new AppError('Insufficient permissions', 403);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function cardAccess(allowedRoles = ROLES) {
  return async (req, res, next) => {
    try {
      const cardId = req.params.cardId ?? req.params.id;
      if (!cardId) throw new AppError('Card ID required', 400);
      const card = await Card.findById(cardId);
      if (!card) throw new AppError('Card not found', 404);
      req.card = card;
      await checkBoardMembership(req, card.boardId.toString());
      const hasRole = allowedRoles.includes(req.boardMember.role);
      if (!hasRole) throw new AppError('Insufficient permissions', 403);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function boardAccess(allowedRoles = ROLES) {
  return async (req, res, next) => {
    try {
      const boardId = req.params.boardId ?? req.params.id;
      if (!boardId) {
        throw new AppError('Board ID required', 400);
      }
      const membership = await BoardMember.findOne({
        boardId,
        userId: req.user._id,
      });
      if (!membership) {
        const board = await Board.findById(boardId);
        if (!board) {
          throw new AppError('Board not found', 404);
        }
        if (board.visibility === 'private') {
          throw new AppError('Access denied to this board', 403);
        }
        throw new AppError('Access denied to this board', 403);
      }
      const hasRole = allowedRoles.includes(membership.role);
      if (!hasRole) {
        throw new AppError('Insufficient permissions', 403);
      }
      req.boardMember = membership;
      req.boardId = boardId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireOwner(req, res, next) {
  if (req.boardMember?.role !== 'owner') {
    return next(new AppError('Only the board owner can perform this action', 403));
  }
  next();
}

export function requireAdminOrOwner(req, res, next) {
  const role = req.boardMember?.role;
  if (role !== 'owner' && role !== 'admin') {
    return next(new AppError('Admin or owner access required', 403));
  }
  next();
}
