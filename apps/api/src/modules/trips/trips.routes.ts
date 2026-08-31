import { Router } from 'express';
import { TripsController } from './trips.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/require-role.js';
import { validate } from '../../middleware/validate.js';
import {
  createTripSchema,
  updateTripSchema,
  getTripParamsSchema,
  holdSeatsSchema,
  releaseSeatsSchema,
  checkInSchema,
} from './trips.schemas.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.get('/', TripsController.list);
router.get('/:id', validate(getTripParamsSchema), TripsController.getById);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(createTripSchema),
  TripsController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(updateTripSchema),
  TripsController.update
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER),
  validate(getTripParamsSchema),
  TripsController.delete
);

// Seats management
router.get('/:id/seats', validate(getTripParamsSchema), TripsController.getSeats);
router.post('/:id/hold-seats', authenticate, requireRole(ROLES.OWNER, ROLES.ADMIN_CS), validate(holdSeatsSchema), TripsController.holdSeats);
router.post('/:id/release-seats', authenticate, requireRole(ROLES.OWNER, ROLES.ADMIN_CS), validate(releaseSeatsSchema), TripsController.releaseSeats);

// Manifest and Check-in
router.get('/:id/manifest', authenticate, validate(getTripParamsSchema), TripsController.getManifest);
router.patch(
  '/:id/manifest/:manifestId/check-in',
  authenticate,
  validate(checkInSchema),
  TripsController.checkIn
);

export default router;
