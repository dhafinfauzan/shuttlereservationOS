import { z } from 'zod';

export const createDriverSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required (e.g. A. Nugraha)'),
    phone: z.string().min(8, 'Phone number is required'),
    licenseNumber: z.string().min(5, 'License number is required'),
    status: z.enum(['active', 'off_duty', 'on_trip']).default('active'),
    avatarInitials: z.string().optional(),
    userId: z.string().uuid().optional().nullable(),
  }),
});

export const updateDriverSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid driver ID'),
  }),
  body: createDriverSchema.shape.body.partial(),
});

export const getDriverParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid driver ID'),
  }),
});
