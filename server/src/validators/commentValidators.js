import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Comment text is required').max(2000),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(2000),
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
