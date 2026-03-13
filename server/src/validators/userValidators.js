import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    body: z.object({
      fullName: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().url().optional().nullable(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.newPassword && !data.body.currentPassword) return false;
      return true;
    },
    { message: 'Current password is required to set a new password', path: ['body'] }
  );

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body });
    if (!result.success) {
      const first = result.error.errors[0];
      const message = first?.message || 'Validation failed';
      return res.status(400).json({ success: false, error: message });
    }
    req.validated = result.data;
    next();
  };
}
