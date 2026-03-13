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

export default function EditBoardModal({ board, onClose, onSubmit }) {
  const [backgroundColor, setBackgroundColor] = useState(board?.backgroundColor ?? BOARD_COLORS[0]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: board?.title ?? '',
      description: board?.description ?? '',
      visibility: board?.visibility ?? 'private',
    },
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
      aria-labelledby="edit-board-title"
    >
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h2 id="edit-board-title" className="text-lg font-semibold text-slate-900">
            Edit board
          </h2>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Background</label>
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-8 h-8 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
                  style={{
                    backgroundColor: color,
                    borderColor: color === backgroundColor ? '#475569' : 'transparent',
                  }}
                  onClick={() => setBackgroundColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="edit-board-title-input" className="block text-sm font-medium text-slate-700 mb-1.5">
              Board title
            </label>
            <input
              id="edit-board-title-input"
              type="text"
              {...register('title')}
              className="input-base"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="edit-board-desc" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              id="edit-board-desc"
              {...register('description')}
              rows={2}
              className="input-base resize-none"
            />
          </div>
          <div>
            <label htmlFor="edit-board-visibility" className="block text-sm font-medium text-slate-700 mb-1.5">
              Visibility
            </label>
            <select id="edit-board-visibility" {...register('visibility')} className="input-base">
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
