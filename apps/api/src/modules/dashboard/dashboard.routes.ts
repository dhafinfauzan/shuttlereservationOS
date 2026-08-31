import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/summary', authenticate, DashboardController.getSummary);
router.get('/revenue', authenticate, DashboardController.getRevenue);
router.get('/occupancy', authenticate, DashboardController.getOccupancy);
router.get('/activity', authenticate, DashboardController.getActivity);

export default router;
