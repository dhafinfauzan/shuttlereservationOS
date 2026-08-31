import { z } from 'zod';

export const createPointSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Point name is required'),
    city: z.string().min(2, 'City is required'),
    address: z.string().min(3, 'Address is required'),
    type: z.enum(['pickup', 'dropoff', 'both']).default('both'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updatePointSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid point ID'),
  }),
  body: createPointSchema.shape.body.partial(),
});

export const getPointParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid point ID'),
  }),
});
