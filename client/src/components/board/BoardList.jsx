import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import CardItem from '../card/CardItem.jsx';

export default function BoardList({
  list,
  onCardClick,
  onAddCard,
  onRenameList,
  onDeleteList,
  isOwnerOrAdmin,
}) {
  const [addingCard, setAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);

  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list._id}`,
    data: { listId: list._id },
  });

  const handleSubmitCard = (e) => {
    e.preventDefault();
    const t = cardTitle.trim();
    if (!t) return;
    onAddCard(list._id, t).then(() => {
      setCardTitle('');
      setAddingCard(false);
    }).catch(() => {});
  };

  const handleRename = () => {
    const t = titleValue.trim();
    if (t && t !== list.title) {
      onRenameList(list._id, t).then(() => setEditingTitle(false));
    } else {
      setTitleValue(list.title);
      setEditingTitle(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-72 rounded-2xl bg-slate-100/80 border border-slate-200/80
        flex flex-col max-h-[calc(100vh-14rem)] shadow-soft
        ${isOver ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-slate-50' : ''}
      `}
    >
      <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-200/80">
        {editingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="input-base py-2 text-sm font-medium flex-1"
            autoFocus
            aria-label="List title"
          />
        ) : (
          <button
            type="button"
            onClick={() => isOwnerOrAdmin && setEditingTitle(true)}
            className="text-sm font-semibold text-slate-800 truncate text-left flex-1 py-1.5 px-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            {list.title}
          </button>
        )}
        {isOwnerOrAdmin && !editingTitle && (
          <button
            type="button"
            onClick={() => onDeleteList(list._id)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete list"
            aria-label="Delete list"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {(list.cards || []).map((card) => (
          <CardItem
            key={card._id}
            card={card}
            onClick={onCardClick}
          />
        ))}
        {addingCard && (
          <form onSubmit={handleSubmitCard} className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft">
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="Card title"
              className="input-base py-2 text-sm"
              autoFocus
              aria-label="Card title"
            />
            <div className="flex gap-2 mt-3">
              <button type="submit" className="btn-primary text-sm py-2">
                Add
              </button>
              <button type="button" onClick={() => { setAddingCard(false); setCardTitle(''); }} className="btn-secondary text-sm py-2">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      {isOwnerOrAdmin && !addingCard && (
        <div className="p-3 border-t border-slate-200/80">
          <button
            type="button"
            onClick={() => setAddingCard(true)}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/70 flex items-center gap-2 justify-center transition-colors duration-150"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add a card
          </button>
        </div>
      )}
    </div>
  );
}
