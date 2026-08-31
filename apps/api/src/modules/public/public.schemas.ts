import { z } from 'zod';

export const publicSearchSchema = z.object({
  query: z.object({
    from: z.string().optional().default('Jakarta'),
    to: z.string().optional().default('Bandung'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
    passengers: z.string().optional().default('1'),
  }),
});

export const publicBookingSchema = z.object({
  body: z.object({
    tripId: z.string().uuid('Invalid trip ID'),
    customerName: z.string().min(2, 'Customer name is required'),
    customerPhone: z.string().min(8, 'Phone / WhatsApp is required'),
    customerEmail: z.string().email('Valid email is required'),
    seatNumbers: z.array(z.string().or(z.number())).min(1, 'Select at least 1 seat'),
    passengerCount: z.number().int().positive().optional().default(1),
    notes: z.string().optional(),
  }).superRefine((booking, context) => {
    if (booking.passengerCount !== booking.seatNumbers.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passengerCount'],
        message: 'Passenger count must match the number of selected seats',
      });
    }
  }),
});

export const publicBookingCodeParamSchema = z.object({
  params: z.object({
    bookingCode: z.string().min(3, 'Booking code is required'),
  }),
});

export const publicBookingAccessSchema = z.object({
  params: publicBookingCodeParamSchema.shape.params,
  headers: z.object({
    'x-booking-token': z.string().min(32, 'Booking access token is invalid').optional(),
  }).passthrough(),
});
