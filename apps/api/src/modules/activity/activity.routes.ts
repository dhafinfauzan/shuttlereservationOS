import { Router } from 'express';
import { ActivityController } from './activity.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
router.get('/', authenticate, ActivityController.getRecent);

export default router;
