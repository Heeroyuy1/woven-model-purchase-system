import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import dns from 'dns';
import { env } from '../config/env';

// Local OpenText DNS fix: bypass Node.js DNS resolution for smtp.gmail.com
// Use hostname by default (works on Railway/production), IP bypass for local
dns.setDefaultResultOrder('verbatim');
const SMTP_HOST = process.env.NODE_ENV === 'production' ? env.SMTP_HOST : (() => {
  try { dns.setServers(['127.0.0.1', '8.8.8.8', '1.1.1.1']); } catch {}
  return process.env.NODE_ENV === 'production' ? env.SMTP_HOST : '64.233.180.108';
})();

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

/**
 * Email service using nodemailer
 * Falls back to console logging if SMTP not configured
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private useConsoleFallback: boolean = false;

  constructor() {
    if (env.SMTP_HOST) {
      // Use SMTP_HOST (IP bypass for local dev, hostname for Railway/production)
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          servername: 'smtp.gmail.com', // Required for SNI when using IP
          rejectUnauthorized: true,
        },
      });
    } else {
      this.useConsoleFallback = true;
      console.warn('[EmailService] SMTP not configured — emails will be logged to console');
    }
  }

  /**
   * Send an email
   */
  private async sendMail(to: string, subject: string, html: string, template?: string, orderId?: string): Promise<void> {
    if (this.useConsoleFallback || !this.transporter) {
      console.log(`[EmailService] TO: ${to}`);
      console.log(`[EmailService] SUBJECT: ${subject}`);
      console.log(`[EmailService] HTML: ${html.substring(0, 200)}...`);
      await this.logEmail(to, subject, template || 'unknown', 'sent', undefined, orderId);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"Woven Model" <${env.SMTP_FROM}>`,
        replyTo: env.SMTP_REPLY_TO || 'sales@wovenmodel.com',
        to,
        subject,
        html,
      });
      await this.logEmail(to, subject, template || 'unknown', 'sent', undefined, orderId);
    } catch (error: any) {
      console.error('[EmailService] Failed to send email:', error);
      await this.logEmail(to, subject, template || 'unknown', 'failed', error.message, orderId);
    }
  }

  /**
   * Log email to database
   */
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

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<void> {
    const subject = `Order Confirmation — #${data.orderNumber}`;
    const html = orderConfirmationHtml(data);
    await this.sendMail(to, subject, html, 'order_confirmation', data.orderNumber);
  }

  /**
   * Send license delivery email with product and activation details
   */
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

  /**
   * Send thank you email after purchase
   */
  async sendThankYou(to: string, data: ThankYouData): Promise<void> {
    const subject = 'Thank You for Your Purchase!';
    const html = thankYou({ customerName: data.name });
    await this.sendMail(to, subject, html, 'thank_you');
  }
}

// Singleton instance
export const emailService = new EmailService();
