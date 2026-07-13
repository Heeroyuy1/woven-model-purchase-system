import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

// HTML email templates
import { orderConfirmationHtml } from '../templates/orderConfirmation';
import { licenseDelivery } from '../templates/licenseDelivery';
import { thankYou } from '../templates/thankYou';

interface OrderConfirmationData {
  name: string;
  orderNumber: string;
  date: string;
  products: { name: string; quantity: number; price: number }[];
  total: number;
}

interface LicenseDeliveryData {
  productName: string;
  licenseKey: string;
  version: string;
  downloadUrl: string;
  portalUrl: string;
}

interface ThankYouData {
  name: string;
}

const MAILJET_API = 'https://api.mailjet.com/v3.1/send';

/**
 * Email service using SendGrid REST API (HTTPS port 443, works on Railway)
 * Falls back to console logging if no API key configured
 */
export class EmailService {
  private apiKey: string = '';
  private useConsoleFallback: boolean = false;

  constructor() {
    this.apiKey = env.SMTP_PASS || '';
    if (this.apiKey.startsWith('SG.')) {
      console.log('[EmailService] SendGrid API key found — using REST API');
    } else if (this.apiKey) {
      console.log('[EmailService] SMTP password set but not a SendGrid key');
    } else {
      this.useConsoleFallback = true;
      console.warn('[EmailService] No email API key configured — emails logged to console');
    }
  }

  private async sendMail(to: string, subject: string, html: string, template?: string, orderId?: string): Promise<void> {
    if (this.useConsoleFallback || !this.apiKey) {
      console.log(`[EmailService] TO: ${to}`);
      console.log(`[EmailService] SUBJECT: ${subject}`);
      await this.logEmail(to, subject, template || 'unknown', 'sent', undefined, orderId);
      return;
    }

    try {
      const resp = await fetch(MAILJET_API, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from('7ccfb770a40fea988798f53f4a2e873f:902f6ad287f9c631ed7aa10e06acd1ba').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Messages: [{
            From: { Email: env.SMTP_FROM || 'ceo@wovenmodel.com', Name: 'Woven Model' },
            To: [{ Email: to, Name: '' }],
            ReplyTo: { Email: env.SMTP_REPLY_TO || 'sales@wovenmodel.com' },
            Subject: subject,
            HTMLPart: html,
          }],
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Mailjet API ${resp.status}: ${errBody.slice(0, 200)}`);
      }

      console.log(`[EmailService] Sent: ${subject} -> ${to}`);
      await this.logEmail(to, subject, template || 'unknown', 'sent', undefined, orderId);
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error.message);
      await this.logEmail(to, subject, template || 'unknown', 'failed', error.message, orderId);
    }
  }

  private async logEmail(to: string, subject: string, template: string, status: string, error?: string, orderId?: string): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          to,
          subject,
          template,
          status,
          error,
          orderId: orderId || null,
        },
      });
    } catch (logError) {
      console.error('[EmailService] Failed to log email:', logError);
    }
  }

  async sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<void> {
    const subject = `Order Confirmation — #${data.orderNumber}`;
    const html = orderConfirmationHtml(data);
    await this.sendMail(to, subject, html, 'order_confirmation', data.orderNumber);
  }

  async sendLicenseDelivery(to: string, data: LicenseDeliveryData): Promise<void> {
    const subject = `Your License for ${data.productName} is Ready`;
    const html = licenseDelivery({
      customerName: data.productName,
      productName: data.productName,
      licenseKey: data.licenseKey,
      productVersion: data.version,
      downloadUrl: data.downloadUrl,
      installationUrl: data.portalUrl,
      portalUrl: data.portalUrl,
      documentationUrl: 'https://docs.wovenmodel.com',
      multipleItems: false,
      licenses: [{ productName: data.productName, licenseKey: data.licenseKey }],
    });
    await this.sendMail(to, subject, html, 'license_delivery');
  }

  async sendThankYou(to: string, data: ThankYouData): Promise<void> {
    const subject = 'Thank You for Your Purchase!';
    const html = thankYou({ customerName: data.name });
    await this.sendMail(to, subject, html, 'thank_you');
  }
}

export const emailService = new EmailService();
