import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required').max(100),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
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
