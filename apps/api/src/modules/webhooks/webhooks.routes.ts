import { Router } from 'express';
import { WebhooksController } from './webhooks.controller.js';

const router = Router();

router.post('/payment', WebhooksController.handlePaymentWebhook);

export default router;
