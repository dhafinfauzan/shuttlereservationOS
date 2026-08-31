import { Router } from 'express';
import { VehiclesController } from './vehicles.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/require-role.js';
import { validate } from '../../middleware/validate.js';
import { createVehicleSchema, updateVehicleSchema, getVehicleParamsSchema } from './vehicles.schemas.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.get('/', authenticate, VehiclesController.list);
router.get('/:id', authenticate, validate(getVehicleParamsSchema), VehiclesController.getById);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(createVehicleSchema),
  VehiclesController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(updateVehicleSchema),
  VehiclesController.update
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER),
  validate(getVehicleParamsSchema),
  VehiclesController.delete
);

export default router;
