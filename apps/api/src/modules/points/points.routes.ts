import { Router } from 'express';
import { PointsController } from './points.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/require-role.js';
import { validate } from '../../middleware/validate.js';
import { createPointSchema, updatePointSchema, getPointParamsSchema } from './points.schemas.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.get('/', PointsController.list);
router.get('/:id', validate(getPointParamsSchema), PointsController.getById);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(createPointSchema),
  PointsController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(updatePointSchema),
  PointsController.update
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER),
  validate(getPointParamsSchema),
  PointsController.delete
);

export default router;
