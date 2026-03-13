import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import EditBoardModal from './EditBoardModal.jsx';

export default function BoardHeader({ board, onUpdate, onInviteClick }) {
  const [editOpen, setEditOpen] = useState(false);
  const [starred, setStarred] = useState(board?.membership?.starred ?? false);
  useEffect(() => setStarred(board?.membership?.starred ?? false), [board?.membership?.starred]);
  const isOwnerOrAdmin = board?.membership?.role === 'owner' || board?.membership?.role === 'admin';

  const handleStar = () => {
    if (starred) {
      api.delete(`/boards/${board._id}/star`).then(() => setStarred(false));
    } else {
      api.post(`/boards/${board._id}/star`).then(() => setStarred(true));
    }
  };

  const handleUpdate = (payload) => {
    return api.patch(`/boards/${board._id}`, payload).then(() => {
      onUpdate?.();
      setEditOpen(false);
    });
  };

  return (
    <div className="flex flex-col gap-4 mb-2">
      <div
        className="w-full rounded-2xl h-24 sm:h-28 flex items-end p-4 sm:p-5 shadow-soft border border-white/20"
        style={{ backgroundColor: board?.backgroundColor || '#0f766e' }}
      >
        <h1 className="text-xl sm:text-2xl font-semibold text-white drop-shadow-sm tracking-tight">
          {board?.title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleStar}
          className="btn-secondary text-sm py-2"
        >
          {starred ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Starred
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Star
            </span>
          )}
        </button>
        <Link to="/dashboard" className="btn-secondary text-sm py-2">
          Dashboard
        </Link>
        {isOwnerOrAdmin && (
          <>
            <button type="button" onClick={() => setEditOpen(true)} className="btn-secondary text-sm py-2">
              Edit board
            </button>
            <button type="button" onClick={onInviteClick} className="btn-primary text-sm py-2">
              Invite
            </button>
          </>
        )}
      </div>
      {board?.description && (
        <p className="text-sm text-slate-600 max-w-2xl">{board.description}</p>
      )}
      {editOpen && (
        <EditBoardModal
          board={board}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
