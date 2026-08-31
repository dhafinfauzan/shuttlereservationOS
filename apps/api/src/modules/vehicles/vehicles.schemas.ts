import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    plateNumber: z.string().min(3, 'Plate number is required (e.g. B 7124 KLN)'),
    model: z.string().min(2, 'Vehicle model is required (e.g. Toyota HiAce Premio)'),
    capacity: z.number().int().positive().default(12),
    seatLayout: z.string().default('2-1'),
    status: z.enum(['active', 'maintenance', 'inactive']).default('active'),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid vehicle ID'),
  }),
  body: createVehicleSchema.shape.body.partial(),
});

export const getVehicleParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid vehicle ID'),
  }),
});
