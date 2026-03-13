import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import api from '../services/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import BoardHeader from '../components/board/BoardHeader.jsx';
import BoardList from '../components/board/BoardList.jsx';
import CardItem from '../components/card/CardItem.jsx';
import InviteMemberModal from '../components/members/InviteMemberModal.jsx';
import CardDetailModal from '../components/card/CardDetailModal.jsx';

export default function Board() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({ assignee: '', dueDate: '', priority: '', label: '', completed: '' });
  const [searchResults, setSearchResults] = useState(null);
  const [boardMembers, setBoardMembers] = useState([]);

  const fetchBoard = useCallback(() => {
    if (!boardId) return;
    api.get(`/boards/${boardId}`).then((res) => setBoard(res.data.board)).catch(() => setBoard(null));
  }, [boardId]);

  const fetchLists = useCallback(() => {
    if (!boardId) return;
    api
      .get(`/boards/${boardId}/lists`)
      .then((res) => setLists(res.data.lists || []))
      .catch(() => setLists([]));
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    setError('');
    api
      .get(`/boards/${boardId}`)
      .then((res) => setBoard(res.data.board))
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load board');
        setBoard(null);
      })
      .finally(() => setLoading(false));
  }, [boardId]);

  useEffect(() => {
    if (board && boardId) fetchLists();
  }, [board, boardId, fetchLists]);

  useEffect(() => {
    if (!boardId || !board) return;
    api.get(`/boards/${boardId}/members`).then((res) => setBoardMembers(res.data.members || []));
  }, [boardId, board]);

  const refreshBoard = () => {
    fetchBoard();
    fetchLists();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.id.startsWith('card-')) {
      const cardId = active.id.replace('card-', '');
      const list = lists.find((l) => l.cards?.some((c) => c._id === cardId));
      const card = list?.cards?.find((c) => c._id === cardId);
      if (card) setActiveCard(card);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith('card-')) return;
    const cardId = activeId.replace('card-', '');
    let targetListId = null;
    let targetOrder = 0;
    if (overId.startsWith('list-')) {
      targetListId = overId.replace('list-', '');
      targetOrder = 0;
    } else if (overId.startsWith('card-')) {
      const overCardId = overId.replace('card-', '');
      const listContainingOver = lists.find((l) => l.cards?.some((c) => c._id === overCardId));
      if (listContainingOver) {
        targetListId = listContainingOver._id;
        const idx = listContainingOver.cards?.findIndex((c) => c._id === overCardId) ?? 0;
        targetOrder = idx;
      }
    }
    if (!targetListId) return;
    api
      .patch(`/cards/${cardId}`, { listId: targetListId, order: targetOrder })
      .then(() => fetchLists())
      .catch(() => {});
  };

  const handleAddCard = (listId, title) => {
    return api.post(`/lists/${listId}/cards`, { title }).then(() => fetchLists());
  };

  const handleAddList = (title) => {
    return api.post(`/boards/${boardId}/lists`, { title }).then(() => fetchLists());
  };

  const handleRenameList = (listId, title) => {
    return api.patch(`/lists/${listId}`, { title }).then(() => fetchLists());
  };

  const handleDeleteList = (listId) => {
    if (!window.confirm('Delete this list and all its cards?')) return;
    return api.delete(`/lists/${listId}`).then(() => fetchLists());
  };

  const handleCardUpdate = () => {
    fetchLists();
    if (selectedCard) {
      api.get(`/cards/${selectedCard._id}`).then((res) => setSelectedCard(res.data.card));
    }
  };

  const runSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (searchFilters.assignee) params.set('assignee', searchFilters.assignee);
    if (searchFilters.dueDate) params.set('dueDate', searchFilters.dueDate);
    if (searchFilters.priority) params.set('priority', searchFilters.priority);
    if (searchFilters.label) params.set('label', searchFilters.label);
    if (searchFilters.completed !== '') params.set('completed', searchFilters.completed);
    api
      .get(`/boards/${boardId}/cards/search?${params.toString()}`)
      .then((res) => setSearchResults(res.data.cards || []))
      .catch(() => setSearchResults([]));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilters({ assignee: '', dueDate: '', priority: '', label: '', completed: '' });
    setSearchResults(null);
  };

  const isOwnerOrAdmin = board?.membership?.role === 'owner' || board?.membership?.role === 'admin';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500">Loading board...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 max-w-md"
        role="alert"
      >
        <p className="text-slate-800 font-medium">{error || 'Board not found'}</p>
        <p className="mt-1 text-sm text-slate-600">You may not have access or the board was removed.</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-4 btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <BoardHeader
        board={board}
        onUpdate={refreshBoard}
        onInviteClick={() => setInviteOpen(true)}
      />
      <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-200/80">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          placeholder="Search cards..."
          className="input-base rounded-xl py-2 text-sm w-44 sm:w-52 max-w-full"
          aria-label="Search cards"
        />
        <select
          value={searchFilters.priority}
          onChange={(e) => setSearchFilters((f) => ({ ...f, priority: e.target.value }))}
          className="input-base py-2 text-sm w-auto min-w-[120px]"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={searchFilters.completed}
          onChange={(e) => setSearchFilters((f) => ({ ...f, completed: e.target.value }))}
          className="input-base py-2 text-sm w-auto min-w-[100px]"
          aria-label="Filter by completion"
        >
          <option value="">All</option>
          <option value="false">Not completed</option>
          <option value="true">Completed</option>
        </select>
        <input
          type="date"
          value={searchFilters.dueDate}
          onChange={(e) => setSearchFilters((f) => ({ ...f, dueDate: e.target.value }))}
          className="input-base py-2 text-sm w-auto"
          aria-label="Filter by due date"
        />
        <select
          value={searchFilters.assignee}
          onChange={(e) => setSearchFilters((f) => ({ ...f, assignee: e.target.value }))}
          className="input-base py-2 text-sm w-auto min-w-[140px]"
          aria-label="Filter by assignee"
        >
          <option value="">Any assignee</option>
          {boardMembers.map((m) => (
            <option key={m.userId} value={m.userId}>{m.fullName || m.email}</option>
          ))}
        </select>
        <button type="button" onClick={runSearch} className="btn-primary text-sm py-2">
          Search
        </button>
        {searchResults !== null && (
          <button type="button" onClick={clearSearch} className="btn-secondary text-sm py-2">
            Clear
          </button>
        )}
      </div>
      {searchResults !== null && (
        <div className="py-4 border-b border-slate-200/80">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            Search results ({searchResults.length})
          </h3>
          {searchResults.length === 0 ? (
            <p className="text-sm text-slate-500">No cards match your filters.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {searchResults.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCard(c)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-left hover:border-slate-300 hover:shadow-soft transition-shadow max-w-xs truncate card-surface"
                  >
                    <span className="font-medium text-slate-800">{c.title}</span>
                    {c.listId?.title && (
                      <span className="ml-2 text-slate-500 text-xs">in {c.listId.title}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden pt-4 pb-4">
          <div className="flex gap-4 h-full min-w-min px-1">
            {lists.map((list) => (
              <BoardList
                key={list._id}
                list={list}
                onCardClick={setSelectedCard}
                onAddCard={handleAddCard}
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
                isOwnerOrAdmin={isOwnerOrAdmin}
              />
            ))}
            {isOwnerOrAdmin && (
              <div className="flex-shrink-0 w-72">
                <AddListButton onAdd={handleAddList} />
              </div>
            )}
          </div>
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="w-72 rounded-xl border-2 border-slate-300 bg-white p-3 shadow-soft-lg opacity-95">
              <p className="text-sm font-medium text-slate-800 truncate">{activeCard.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {inviteOpen && (
        <InviteMemberModal
          boardId={board._id}
          onClose={() => setInviteOpen(false)}
          onSuccess={refreshBoard}
        />
      )}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          boardId={board._id}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={() => { setSelectedCard(null); fetchLists(); }}
        />
      )}
    </div>
  );
}

function AddListButton({ onAdd }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onAdd(t).then(() => { setTitle(''); setAdding(false); });
  };

  if (adding) {
    return (
      <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-100/80 border border-slate-200/80 p-3 shadow-soft">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="List title"
          className="input-base py-2 text-sm"
          autoFocus
          aria-label="List title"
        />
        <div className="flex gap-2 mt-3">
          <button type="submit" className="btn-primary text-sm py-2">
            Add list
          </button>
          <button type="button" onClick={() => { setAdding(false); setTitle(''); }} className="btn-secondary text-sm py-2">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="w-full rounded-2xl bg-slate-100/60 hover:bg-slate-200/70 border-2 border-dashed border-slate-200 py-8 text-sm font-medium text-slate-600 flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add a list
    </button>
  );
}
