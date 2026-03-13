import { Activity } from '../models/Activity.js';

export async function createActivity({ boardId, type, userId, cardId, listId, metadata = {} }) {
  await Activity.create({
    boardId,
    type,
    userId,
    ...(cardId && { cardId }),
    ...(listId && { listId }),
    metadata,
  });
}
