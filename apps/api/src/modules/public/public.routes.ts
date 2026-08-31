import { Router } from 'express';
import { PublicController } from './public.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  publicSearchSchema,
  publicBookingSchema,
  publicBookingAccessSchema,
} from './public.schemas.js';

const router = Router();

// Schedule search
router.get('/schedules', validate(publicSearchSchema), PublicController.searchSchedules);
router.get('/schedules/:tripId/seats', PublicController.getScheduleSeats);

// Customer booking flow
router.post('/bookings', validate(publicBookingSchema), PublicController.createBooking);
router.get('/bookings/:bookingCode', validate(publicBookingAccessSchema), PublicController.getBookingTicket);
router.post(
  '/bookings/:bookingCode/simulate-payment',
  validate(publicBookingAccessSchema),
  PublicController.simulatePayment
);

export default router;
