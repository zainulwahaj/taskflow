import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import BoardCard from '../components/board/BoardCard.jsx';
import CreateBoardModal from '../components/board/CreateBoardModal.jsx';
import EditBoardModal from '../components/board/EditBoardModal.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ boards: [], recent: [], starred: [], shared: [] });
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editBoard, setEditBoard] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchBoards = () => {
    setLoading(true);
    setError('');
    api
      .get('/boards')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load boards'))
      .finally(() => setLoading(false));
  };

  const fetchInvitations = () => {
    api.get('/invitations/me').then((res) => setInvitations(res.data.invitations || [])).catch(() => {});
  };

  useEffect(() => {
    fetchBoards();
    fetchInvitations();
  }, []);

  const handleCreateBoard = (payload) => {
    return api.post('/boards', payload).then(() => fetchBoards());
  };

  const handleAcceptInvitation = (boardId, invId) => {
    return api.post(`/boards/${boardId}/invitations/${invId}/accept`).then(() => {
      fetchBoards();
      fetchInvitations();
      navigate(`/boards/${boardId}`);
    });
  };

  const handleDeclineInvitation = (boardId, invId) => {
    return api.post(`/boards/${boardId}/invitations/${invId}/decline`).then(() => {
      fetchInvitations();
    });
  };

  const handleUpdateBoard = (boardId, payload) => {
    return api.patch(`/boards/${boardId}`, payload).then(() => {
      fetchBoards();
      setEditBoard(null);
    });
  };

  const handleStar = (board) => {
    return api.post(`/boards/${board._id}/star`).then(() => fetchBoards());
  };

  const handleUnstar = (board) => {
    return api.delete(`/boards/${board._id}/star`).then(() => fetchBoards());
  };

  const handleDeleteClick = (board) => setDeleteConfirm(board);

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    api
      .delete(`/boards/${deleteConfirm._id}`)
      .then(() => {
        fetchBoards();
        setDeleteConfirm(null);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to delete'));
  };

  const isOwnerOrAdmin = (board) =>
    board.membership?.role === 'owner' || board.membership?.role === 'admin';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500">Loading boards...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your boards and recent activity</p>
      </div>

      {invitations.length > 0 && (
        <section className="mb-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-amber-900 mb-3">Pending invitations</h2>
          <ul className="space-y-3">
            {invitations.map((inv) => (
              <li
                key={inv._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-white/80 px-4 py-3 border border-amber-100/80"
              >
                <span className="text-sm text-slate-700">
                  <strong className="font-medium text-slate-900">{inv.inviterName}</strong>
                  {' '}invited you to{' '}
                  <strong className="font-medium text-slate-900">{inv.boardTitle}</strong>
                </span>
                <span className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAcceptInvitation(inv.boardId, inv._id)}
                    className="btn-primary px-3 py-2 text-sm"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineInvitation(inv.boardId, inv._id)}
                    className="btn-secondary px-3 py-2 text-sm"
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <div
          className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Recent boards
          </h2>
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-secondary text-sm w-fit">
            Create board
          </button>
        </div>
        {data.recent?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/80 min-h-[160px] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <span className="text-2xl text-slate-400 font-light">+</span>
              <span className="mt-2 text-sm font-medium text-slate-600">New board</span>
            </button>
            {data.recent.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onStar={handleStar}
                onUnstar={handleUnstar}
                onEdit={(b) => setEditBoard(b)}
                onDelete={handleDeleteClick}
                isOwnerOrAdmin={isOwnerOrAdmin(board)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No boards yet"
            description="Create your first board to start organizing tasks and collaborating."
            action={
              <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
                Create board
              </button>
            }
          />
        )}
      </section>

      {data.starred?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
            Starred
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.starred.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onStar={handleStar}
                onUnstar={handleUnstar}
                onEdit={(b) => setEditBoard(b)}
                onDelete={handleDeleteClick}
                isOwnerOrAdmin={isOwnerOrAdmin(board)}
              />
            ))}
          </div>
        </section>
      )}

      {data.shared?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
            Shared with me
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.shared.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onStar={handleStar}
                onUnstar={handleUnstar}
                onEdit={(b) => setEditBoard(b)}
                onDelete={handleDeleteClick}
                isOwnerOrAdmin={isOwnerOrAdmin(board)}
              />
            ))}
          </div>
        </section>
      )}

      {createOpen && (
        <CreateBoardModal
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateBoard}
        />
      )}
      {editBoard && (
        <EditBoardModal
          board={editBoard}
          onClose={() => setEditBoard(null)}
          onSubmit={(payload) => handleUpdateBoard(editBoard._id, payload)}
        />
      )}
      {deleteConfirm && (
        <div
          className="modal-backdrop"
          onClick={() => setDeleteConfirm(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="modal-panel max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-slate-900">
              Delete board?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              &quot;{deleteConfirm.title}&quot; will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
