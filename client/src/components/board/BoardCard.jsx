import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function BoardCard({ board, onStar, onUnstar, onEdit, onDelete, isOwnerOrAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const starred = board.membership?.starred;

  return (
    <div className="group relative">
      <Link
        to={`/boards/${board._id}`}
        className="block rounded-2xl overflow-hidden card-surface border-slate-200/80 hover:border-slate-300/80"
      >
        <div
          className="h-28 w-full rounded-t-2xl transition-transform duration-150 group-hover:scale-[1.02] origin-top"
          style={{ backgroundColor: board.backgroundColor || '#0f766e' }}
        />
        <div className="p-4">
          <h3 className="font-medium text-slate-900 truncate">{board.title}</h3>
          {board.description ? (
            <p className="text-sm text-slate-500 truncate mt-1">{board.description}</p>
          ) : null}
        </div>
      </Link>
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            starred ? onUnstar?.(board) : onStar?.(board);
          }}
          className="p-2 rounded-xl bg-white/95 hover:bg-white shadow-soft border border-slate-100 text-slate-600 hover:text-amber-600 transition-colors"
          title={starred ? 'Unstar' : 'Star'}
          aria-label={starred ? 'Unstar board' : 'Star board'}
        >
          {starred ? (
            <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </button>
        {isOwnerOrAdmin && (
          <>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
              className="p-2 rounded-xl bg-white/95 hover:bg-white shadow-soft border border-slate-100 text-slate-600 transition-colors"
              title="Options"
              aria-label="Board options"
              aria-expanded={menuOpen}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl bg-white shadow-soft-lg border border-slate-100 py-1.5">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={(e) => { e.preventDefault(); setMenuOpen(false); onEdit?.(board); }}
                  >
                    Edit board
                  </button>
                  {board.membership?.role === 'owner' && (
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDelete?.(board); }}
                    >
                      Delete board
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
