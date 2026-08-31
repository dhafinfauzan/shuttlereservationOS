import { z } from 'zod';

export const createRouteSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Route name is required (e.g. Jakarta → Bandung)'),
    originCity: z.string().min(2, 'Origin city is required'),
    destinationCity: z.string().min(2, 'Destination city is required'),
    distanceKm: z.number().int().positive().default(150),
    estimatedMinutes: z.number().int().positive().default(165),
    isActive: z.boolean().default(true),
    pointIds: z
      .array(
        z.object({
          pointId: z.string().uuid(),
          sequence: z.number().int().nonnegative(),
          type: z.enum(['pickup', 'dropoff']).default('pickup'),
          stopMinutes: z.number().int().default(0),
        })
      )
      .optional(),
  }),
});

export const updateRouteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid route ID'),
  }),
  body: createRouteSchema.shape.body.partial(),
});

export const getRouteParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid route ID'),
  }),
});
