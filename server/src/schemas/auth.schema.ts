import { z } from 'zod';

const email = z.email().trim().toLowerCase().max(150);

// bcrypt truncates at 72 bytes (not chars) — a multi-byte password longer than
// 72 bytes would be silently truncated, so enforce the byte length explicitly.
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password too long (72 bytes max)',
  });

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email,
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1).max(72),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema.shape.body>;
export type LoginBody = z.infer<typeof loginSchema.shape.body>;
export type RefreshBody = z.infer<typeof refreshSchema.shape.body>;
