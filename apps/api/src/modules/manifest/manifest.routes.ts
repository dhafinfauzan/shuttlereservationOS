import { Router } from 'express';
import { ManifestController } from './manifest.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateManifestSchema } from './manifest.schemas.js';

const router = Router();

router.get('/trip/:tripId', authenticate, ManifestController.listByTrip);
router.patch('/:id', authenticate, validate(updateManifestSchema), ManifestController.updateStatus);

export default router;
