import { Router } from 'express';
import { DriversController } from './drivers.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/require-role.js';
import { validate } from '../../middleware/validate.js';
import { createDriverSchema, updateDriverSchema, getDriverParamsSchema } from './drivers.schemas.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.get('/', authenticate, DriversController.list);
router.get('/:id', authenticate, validate(getDriverParamsSchema), DriversController.getById);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(createDriverSchema),
  DriversController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(updateDriverSchema),
  DriversController.update
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER),
  validate(getDriverParamsSchema),
  DriversController.delete
);

export default router;
