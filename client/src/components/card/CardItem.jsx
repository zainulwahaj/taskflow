import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const priorityColors = {
  low: 'bg-slate-100 text-slate-600 border-slate-200/80',
  medium: 'bg-amber-50 text-amber-800 border-amber-200/80',
  high: 'bg-red-50 text-red-800 border-red-200/80',
};

export default function CardItem({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${card._id}`,
    data: { card, listId: card.listId },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const dueLabel = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick?.(card)}
      className={`
        rounded-xl border border-slate-200 bg-white p-3 shadow-soft cursor-grab active:cursor-grabbing
        hover:border-slate-300 hover:shadow-soft-lg transition-all duration-150
        ${isDragging ? 'opacity-90 shadow-soft-lg ring-2 ring-slate-300 ring-offset-1' : ''}
      `}
    >
      <p className="text-sm font-medium text-slate-800 truncate">{card.title}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {card.priority && card.priority !== 'medium' && (
          <span className={`text-2xs px-2 py-0.5 rounded-lg border font-medium ${priorityColors[card.priority] || ''}`}>
            {card.priority}
          </span>
        )}
        {dueLabel && (
          <span className="text-2xs px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/80">
            {dueLabel}
          </span>
        )}
        {card.assignedMemberIds?.length > 0 && (
          <span className="text-2xs text-slate-500 self-center">
            {card.assignedMemberIds.length} assignee{card.assignedMemberIds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
