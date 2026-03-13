import { z } from 'zod';

export const createListSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    order: z.number().optional(),
  }),
});

export const updateListSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    order: z.number().optional(),
  }),
});

export const reorderListsSchema = z.object({
  body: z.object({
    listIds: z.array(z.string()),
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
