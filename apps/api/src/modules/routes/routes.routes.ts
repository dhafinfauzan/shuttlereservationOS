import { Router } from 'express';
import { RoutesController } from './routes.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/require-role.js';
import { validate } from '../../middleware/validate.js';
import { createRouteSchema, updateRouteSchema, getRouteParamsSchema } from './routes.schemas.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

router.get('/', RoutesController.list);
router.get('/:id', validate(getRouteParamsSchema), RoutesController.getById);
router.post(
  '/',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(createRouteSchema),
  RoutesController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER, ROLES.ADMIN_CS),
  validate(updateRouteSchema),
  RoutesController.update
);
router.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.OWNER),
  validate(getRouteParamsSchema),
  RoutesController.delete
);

export default router;
