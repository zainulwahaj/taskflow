import { z } from 'zod';

const checklistItemSchema = z.object({
  text: z.string(),
  done: z.boolean().optional(),
});

export const createCardSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().max(5000).optional(),
    order: z.number().optional(),
  }),
});

export const updateCardSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional().nullable(),
    order: z.number().optional(),
    listId: z.string().optional(),
    dueDate: z.union([z.string(), z.null()]).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    completed: z.boolean().optional(),
    assignedMemberIds: z.array(z.string()).optional(),
    labels: z.array(z.string().max(50)).optional(),
    checklist: z.array(checklistItemSchema).optional(),
  }),
});

export const moveCardSchema = z.object({
  body: z.object({
    listId: z.string(),
    order: z.number().optional(),
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
