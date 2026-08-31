import { Request, Response, NextFunction } from 'express';
import { WebhooksService } from './webhooks.service.js';
import { sendSuccess } from '../../lib/response.js';

export class WebhooksController {
  static async handlePaymentWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      const signature = req.headers['x-webhook-signature'] as string | undefined;

      if (!WebhooksService.verifySignature(JSON.stringify(payload), signature)) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' },
        });
      }

      const result = await WebhooksService.handlePaymentWebhook(payload);
      return sendSuccess(res, result, undefined, result.message, 200);
    } catch (err) {
      next(err);
    }
  }
}
