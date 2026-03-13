import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api.js';

const schema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'member']),
});

export default function InviteMemberModal({ boardId, onClose, onSuccess }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'member' },
  });

  const onSubmit = (data) => {
    setError('');
    setSuccess('');
    api
      .post(`/boards/${boardId}/members/invite`, data)
      .then(() => {
        setSuccess(`Invitation sent to ${data.email}`);
        reset({ email: '', role: 'member' });
        onSuccess?.();
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to send invitation'));
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h2 id="invite-modal-title" className="text-lg font-semibold text-slate-900">
            Invite to board
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Send an invitation by email.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5" role="status">
              {success}
            </div>
          )}
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              {...register('email')}
              className="input-base"
              placeholder="colleague@example.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700 mb-1.5">
              Role
            </label>
            <select id="invite-role" {...register('role')} className="input-base">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
              {isSubmitting ? 'Sending...' : 'Send invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
