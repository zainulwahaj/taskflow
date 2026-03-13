import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../context/ToastContext.jsx';

const schema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
});

export default function CardDetailModal({ card, boardId, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [dueDate, setDueDate] = useState(card?.dueDate ? card.dueDate.slice(0, 10) : '');
  const [assignedIds, setAssignedIds] = useState(card?.assignedMemberIds?.map((m) => m._id) ?? []);
  const [labels, setLabels] = useState(card?.labels ?? []);
  const [checklist, setChecklist] = useState(card?.checklist ?? []);
  const [newLabel, setNewLabel] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(card?.completed ?? false);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: card?.title ?? '',
      description: card?.description ?? '',
      priority: card?.priority ?? 'medium',
    },
  });

  const title = watch('title');
  const description = watch('description');
  const priority = watch('priority');

  useEffect(() => {
    if (!card?._id) return;
    api.get(`/cards/${card._id}/members`).then((res) => setMembers(res.data.members || []));
  }, [card?._id]);

  useEffect(() => {
    if (!card?._id) return;
    api.get(`/cards/${card._id}/comments`).then((res) => setComments(res.data.comments || []));
    api.get(`/cards/${card._id}/activity`).then((res) => setActivities(res.data.activities || []));
  }, [card?._id]);

  useEffect(() => {
    setDueDate(card?.dueDate ? card.dueDate.slice(0, 10) : '');
    setAssignedIds(card?.assignedMemberIds?.map((m) => m._id) ?? []);
    setLabels(card?.labels ?? []);
    setChecklist(card?.checklist ?? []);
    setCompleted(card?.completed ?? false);
  }, [card]);

  const saveCard = (payload = {}) => {
    setSaving(true);
    const body = {
      title: payload.title ?? title,
      description: payload.description ?? description,
      priority: payload.priority ?? priority,
      dueDate: dueDate || null,
      completed: payload.completed ?? completed,
      assignedMemberIds: assignedIds,
      labels: labels.filter(Boolean),
      checklist,
    };
    api
      .patch(`/cards/${card._id}`, body)
      .then(() => {
        onUpdate?.();
        toast.success('Card updated');
      })
      .finally(() => setSaving(false));
  };

  const handleFormSubmit = (data) => {
    saveCard(data);
  };

  const toggleAssign = (userId) => {
    setAssignedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const addLabel = () => {
    const t = newLabel.trim();
    if (t && !labels.includes(t)) setLabels((prev) => [...prev, t]);
    setNewLabel('');
  };

  const removeLabel = (l) => setLabels((prev) => prev.filter((x) => x !== l));

  const toggleCheck = (index) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
    );
  };

  const addCheckItem = () => {
    const t = newCheckItem.trim();
    if (t) setChecklist((prev) => [...prev, { text: t, done: false }]);
    setNewCheckItem('');
  };

  const removeCheckItem = (index) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    const t = commentText.trim();
    if (!t) return;
    api
      .post(`/cards/${card._id}/comments`, { text: t })
      .then((res) => {
        setComments((prev) => [...prev, res.data.comment]);
        setCommentText('');
        onUpdate?.();
        toast.success('Comment added');
      });
  };

  const handleUpdateComment = (commentId, text) => {
    const t = text.trim();
    if (!t) return;
    api
      .patch(`/cards/${card._id}/comments/${commentId}`, { text: t })
      .then((res) => {
        setComments((prev) => prev.map((c) => (c._id === commentId ? res.data.comment : c)));
        setEditingCommentId(null);
        setEditCommentText('');
      });
  };

  const handleDeleteComment = (commentId) => {
    api
      .delete(`/cards/${card._id}/comments/${commentId}`)
      .then(() => {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setEditingCommentId(null);
      });
  };

  const activityLabel = (a) => {
    const name = a.fullName || 'Someone';
    switch (a.type) {
      case 'card_created': return `${name} added this card`;
      case 'commented': return `${name} commented`;
      case 'card_moved': return `${name} moved this card`;
      default: return `${name} updated the card`;
    }
  };

  if (!card) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-soft-lg border border-slate-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
            <input
              {...register('title')}
              id="card-modal-title"
              className="flex-1 text-lg font-semibold text-slate-800 border-0 border-b-2 border-transparent focus:border-slate-300 focus:outline-none bg-transparent rounded-none px-0 py-1 transition-colors"
              placeholder="Card title"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {errors.title && (
            <p className="px-4 sm:px-5 text-sm text-red-600" role="alert">{errors.title.message}</p>
          )}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-base resize-none"
                placeholder="Add a description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="card-completed"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="rounded border-slate-300 text-slate-700 focus:ring-slate-400"
              />
              <label htmlFor="card-completed" className="text-sm font-medium text-slate-700">Completed</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select {...register('priority')} className="input-base">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Members</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleAssign(m.userId)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm border transition-colors
                      ${assignedIds.includes(m.userId) ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}
                    `}
                  >
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {(m.fullName || m.email || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="truncate max-w-[100px]">{m.fullName || m.email}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Labels</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {labels.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-sm border border-slate-200/80"
                  >
                    {l}
                    <button type="button" onClick={() => removeLabel(l)} className="text-slate-500 hover:text-red-600 transition-colors" aria-label={`Remove label ${l}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                  placeholder="Add label"
                  className="input-base flex-1 py-2 text-sm"
                />
                <button type="button" onClick={addLabel} className="btn-secondary py-2 text-sm">
                  Add
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Checklist</label>
              <div className="space-y-2 mb-3">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleCheck(i)}
                      className="rounded border-slate-300 text-slate-700"
                    />
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-500' : 'text-slate-800'}`}>{item.text}</span>
                    <button type="button" onClick={() => removeCheckItem(i)} className="text-sm text-slate-400 hover:text-red-600 transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
                  placeholder="Add item"
                  className="input-base flex-1 py-2 text-sm"
                />
                <button type="button" onClick={addCheckItem} className="btn-secondary py-2 text-sm">
                  Add
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Activity</label>
              <ul className="space-y-2 max-h-32 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                {activities.length === 0 ? (
                  <li className="text-sm text-slate-500">No activity yet.</li>
                ) : (
                  activities.map((a) => (
                    <li key={a._id} className="text-sm text-slate-600 flex items-start gap-2 py-1">
                      {a.avatarUrl ? (
                        <img src={a.avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs flex-shrink-0">
                          {(a.fullName || '?').charAt(0)}
                        </span>
                      )}
                      <span className="flex-1 min-w-0">{activityLabel(a)}</span>
                      <span className="text-slate-400 text-xs flex-shrink-0">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Comments</label>
              <ul className="space-y-2 mb-3">
                {comments.map((c) => (
                  <li key={c._id} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    {editingCommentId === c._id ? (
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="input-base flex-1 min-w-0 py-2 text-sm"
                        />
                        <button type="button" onClick={() => handleUpdateComment(c._id, editCommentText)} className="btn-primary text-sm py-2">Save</button>
                        <button type="button" onClick={() => { setEditingCommentId(null); setEditCommentText(''); }} className="btn-secondary text-sm py-2">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-medium text-slate-700">{c.fullName || c.email}</span>
                          <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                          {user?._id === c.userId && (
                            <span className="ml-auto flex gap-2">
                              <button type="button" onClick={() => { setEditingCommentId(c._id); setEditCommentText(c.text); }} className="text-xs text-slate-500 hover:text-slate-700 transition-colors">Edit</button>
                              <button type="button" onClick={() => handleDeleteComment(c._id)} className="text-xs text-red-600 hover:text-red-700 transition-colors">Delete</button>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{c.text}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="input-base flex-1 py-2 text-sm"
                />
                <button type="submit" className="btn-primary py-2 text-sm">
                  Send
                </button>
              </form>
            </div>
          </div>
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this card?')) {
                  api.delete(`/cards/${card._id}`).then(() => onDelete?.());
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Delete card
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary py-2">
                Close
              </button>
              <button type="submit" disabled={saving} className="btn-primary py-2 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
