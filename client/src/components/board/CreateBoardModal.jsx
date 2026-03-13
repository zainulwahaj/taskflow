import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BOARD_COLORS } from '../../utils/constants.js';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['private', 'workspace']),
});

export default function CreateBoardModal({ onClose, onSubmit }) {
  const [backgroundColor, setBackgroundColor] = useState(BOARD_COLORS[0]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', visibility: 'private' },
  });

  const handleFormSubmit = (data) => {
    onSubmit({ ...data, backgroundColor }).then(() => onClose());
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-board-title"
    >
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h2 id="create-board-title" className="text-lg font-semibold text-slate-900">
            Create board
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Add a new board to get started.</p>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Background</label>
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-8 h-8 rounded-xl border-2 border-transparent hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => setBackgroundColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="create-board-title-input" className="block text-sm font-medium text-slate-700 mb-1.5">
              Board title
            </label>
            <input
              id="create-board-title-input"
              type="text"
              {...register('title')}
              className="input-base"
              placeholder="e.g. Marketing"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="create-board-desc" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              id="create-board-desc"
              {...register('description')}
              rows={2}
              className="input-base resize-none"
              placeholder="What's this board about?"
            />
          </div>
          <div>
            <label htmlFor="create-board-visibility" className="block text-sm font-medium text-slate-700 mb-1.5">
              Visibility
            </label>
            <select id="create-board-visibility" {...register('visibility')} className="input-base">
              <option value="private">Private</option>
              <option value="workspace">Workspace</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
