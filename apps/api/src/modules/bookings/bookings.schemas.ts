import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    tripId: z.string().uuid('Invalid trip ID'),
    customerName: z.string().min(2, 'Customer name is required'),
    customerPhone: z.string().min(8, 'Customer phone is required'),
    customerEmail: z.string().email('Invalid customer email address'),
    seatNumbers: z.array(z.string()).min(1, 'At least one seat number is required'),
    passengerNames: z.array(z.string()).optional(),
    paymentMethod: z.enum(['QRIS', 'TRANSFER', 'CASH', 'SIMULATION']).default('QRIS'),
    autoHold: z.boolean().default(true),
    notes: z.string().optional(),
  }),
});

export const updateBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    customerName: z.string().min(2).optional(),
    customerPhone: z.string().min(8).optional(),
    customerEmail: z.string().email().optional(),
    paymentStatus: z.enum(['unpaid', 'paid', 'refunded', 'failed']).optional(),
    bookingStatus: z.enum(['draft', 'seat_held', 'waiting_payment', 'paid', 'expired', 'cancelled']).optional(),
    notes: z.string().optional(),
  }),
});

export const getBookingParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Booking identifier is required'),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().optional().default('Cancelled by customer or operator request'),
  }),
});

export const rescheduleBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    newTripId: z.string().uuid('Invalid new trip ID'),
    newSeatNumbers: z.array(z.string()).min(1, 'New seat numbers are required'),
  }),
});
