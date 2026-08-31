import { Router } from 'express';
import { BookingsController } from './bookings.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/require-role.js';
import { ROLES } from '../../config/constants.js';
import { validate } from '../../middleware/validate.js';
import {
  createBookingSchema,
  updateBookingSchema,
  getBookingParamsSchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
} from './bookings.schemas.js';

const router = Router();
const requireBookingOperator = requireRole(ROLES.OWNER, ROLES.ADMIN_CS);

router.get('/', authenticate, requireBookingOperator, BookingsController.list);
router.get('/:id', authenticate, requireBookingOperator, validate(getBookingParamsSchema), BookingsController.getById);
router.post('/', authenticate, requireBookingOperator, validate(createBookingSchema), BookingsController.create);
router.patch('/:id', authenticate, requireBookingOperator, validate(updateBookingSchema), BookingsController.update);
router.post('/:id/cancel', authenticate, requireBookingOperator, validate(cancelBookingSchema), BookingsController.cancel);
router.post('/:id/reschedule', authenticate, requireBookingOperator, validate(rescheduleBookingSchema), BookingsController.reschedule);

export default router;
