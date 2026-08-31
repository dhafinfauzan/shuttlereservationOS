import { z } from 'zod';

export const createTripSchema = z.object({
  body: z.object({
    tripCode: z.string().optional(), // e.g. "KLN-1830" or auto-generated
    routeId: z.string().uuid('Invalid route ID'),
    vehicleId: z.string().uuid('Invalid vehicle ID'),
    driverId: z.string().uuid('Invalid driver ID'),
    departurePointId: z.string().uuid('Invalid departure point ID'),
    arrivalPointId: z.string().uuid('Invalid arrival point ID'),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format (e.g. 06:30)'),
    arrivalTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format (e.g. 09:15)'),
    timezone: z.string().default('WIB'),
    basePrice: z.number().int().positive('Price must be positive integer IDR'),
    capacity: z.number().int().positive().default(12),
    label: z.string().optional(),
    status: z.enum(['scheduled', 'boarding', 'departed', 'completed', 'cancelled', 'full']).default('scheduled'),
    notes: z.string().optional(),
  }),
});

export const updateTripSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid trip ID'),
  }),
  body: createTripSchema.shape.body.partial(),
});

export const getTripParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid trip ID'),
  }),
});

export const holdSeatsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid trip ID'),
  }),
  body: z.object({
    seatNumbers: z.array(z.string()).min(1, 'At least one seat must be selected'),
    referenceId: z.string().min(1, 'Reference ID / Session ID is required'),
    durationMinutes: z.number().int().positive().optional().default(10),
  }),
});

export const releaseSeatsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid trip ID'),
  }),
  body: z.object({
    seatNumbers: z.array(z.string()).min(1, 'At least one seat must be selected'),
    referenceId: z.string().min(1, 'Reference ID is required'),
  }),
});

export const checkInSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid trip ID'),
    manifestId: z.string().uuid('Invalid manifest ID'),
  }),
  body: z.object({
    status: z.enum(['checked_in', 'no_show', 'pending']).default('checked_in'),
    notes: z.string().optional(),
  }),
});
