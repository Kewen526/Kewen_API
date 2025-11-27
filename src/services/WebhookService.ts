import axios from 'axios';
import prisma from '../config/database';
import config from '../config/env';
import logger from '../utils/logger';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
}

export class WebhookService {
  static async trigger(event: string, data: any): Promise<void> {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          enabled: true,
          events: {
            has: event,
          },
        },
      });

      const promises = webhooks.map((webhook) =>
        this.sendWebhook(webhook.id, webhook.url, event, data, webhook.headers)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Webhook trigger error:', error);
    }
  }

  private static async sendWebhook(
    webhookId: string,
    url: string,
    event: string,
    data: any,
    headers?: any
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: Date.now(),
    };

    let attempts = 0;
    const maxAttempts = config.webhook.retryTimes;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const response = await axios.post(url, payload, {
          headers: headers || {},
          timeout: config.webhook.timeout,
        });

        await prisma.webhookLog.create({
          data: {
            webhookId,
            event,
            payload: payload as any,
            statusCode: response.status,
            response: JSON.stringify(response.data),
            attempts,
          },
        });

        logger.info(`Webhook sent successfully to ${url}`);
        return;
      } catch (error: any) {
        logger.error(`Webhook attempt ${attempts} failed:`, error);

        if (attempts >= maxAttempts) {
          await prisma.webhookLog.create({
            data: {
              webhookId,
              event,
              payload: payload as any,
              statusCode: error.response?.status,
              errorMessage: error.message,
              attempts,
            },
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
  }
}
