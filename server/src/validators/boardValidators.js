import { z } from 'zod';

export const createBoardSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    backgroundColor: z.string().max(20).optional(),
    visibility: z.enum(['private', 'workspace']).optional(),
  }),
});

export const updateBoardSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    backgroundColor: z.string().max(20).optional(),
    visibility: z.enum(['private', 'workspace']).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['admin', 'member']).optional(),
  }),
});

export const updateMemberSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'member']).optional(),
  }),
});

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
