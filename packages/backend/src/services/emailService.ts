import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dns from 'dns/promises';
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

/**
 * Email service using SMTP2GO (SMTP relay) via Nodemailer.
 * - Port 2525 (or 8025/587/80/25) uses STARTTLS.
 * - Port 465 (or 8465/443) uses SSL.
 *
 * DNS note: Node's bundled c-ares resolver (dns.resolve4) returns EFORMERR for
 * mail.smtp2go.com because the response includes an extra TXT record. We resolve
 * the host once at startup using dns.promises.lookup (OS resolver, which works),
 * connect to the resolved IP, and keep SNI correct via `tls.servername`.
 *
 * Falls back to console logging when no SMTP password is configured.
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private useConsoleFallback: boolean = false;
  private transportReady: Promise<void> | null = null;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;

    if (SMTP_HOST && SMTP_PASS) {
      this.transportReady = this.initTransport(SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS);
      console.log(`[EmailService] SMTP transport configured: ${SMTP_HOST}:${SMTP_PORT}`);
    } else {
      this.useConsoleFallback = true;
      console.warn('[EmailService] No SMTP password configured — emails logged to console');
    }
  }

  private async initTransport(host: string, port: number, user: string, pass: string): Promise<void> {
    let connectHost = host;
    let servername: string | undefined;

    try {
      const { address } = await dns.lookup(host, { family: 4 });
      if (address) {
        connectHost = address;
        servername = host;
      }
    } catch (error: any) {
      console.warn(
        `[EmailService] DNS lookup failed for ${host} (${error.code || error.message}) — using hostname directly`,
      );
    }

    this.transporter = nodemailer.createTransport({
      host: connectHost,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      ...(servername ? { tls: { servername } } : {}),
    });
  }

  private async sendMail(to: string, subject: string, html: string, template?: string, orderId?: string): Promise<void> {
    if (this.transportReady) {
      try {
        await this.transportReady;
      } catch (error: any) {
        console.error('[EmailService] SMTP transport init failed:', error.message);
        await this.logEmail(to, subject, template || 'unknown', 'failed', `Transport init failed: ${error.message}`, orderId);
        return;
      }
    }

    if (this.useConsoleFallback || !this.transporter) {
      console.log(`[EmailService] TO: ${to}`);
      console.log(`[EmailService] SUBJECT: ${subject}`);
      await this.logEmail(to, subject, template || 'unknown', 'sent', undefined, orderId);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: { name: 'Woven Model', address: env.SMTP_FROM || 'noreply@wovenmodel.com' },
        to,
        replyTo: env.SMTP_REPLY_TO || 'sales@wovenmodel.com',
        subject,
        html,
      });

      console.log(`[EmailService] Sent: ${subject} -> ${to} (${info.messageId})`);
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
