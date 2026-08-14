import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dns from 'dns/promises';
import net from 'net';
import { env } from '../config/env';

const prisma = new PrismaClient();

const FALLBACK_PORTS = [2525, 587, 465, 8025];

function canConnect(host: string, port: number, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onResult = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => onResult(true));
    socket.once('timeout', () => onResult(false));
    socket.once('error', () => onResult(false));
    socket.connect(port, host);
  });
}

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
      console.log(`[EmailService] SMTP transport initializing: ${SMTP_HOST}:${SMTP_PORT}`);
    } else {
      this.useConsoleFallback = true;
      console.warn('[EmailService] No SMTP password configured — emails logged to console');
    }
  }

  private async initTransport(host: string, port: number, user: string, pass: string): Promise<void> {
    let connectHost = host;
    let servername: string | undefined;
    let connectPort = port;

    try {
      const records = await dns.lookup(host, { all: true, family: 4 });
      const ips = records.map((r) => r.address);
      const ports = [port, ...FALLBACK_PORTS.filter((p) => p !== port)];

      let chosen: { ip: string; port: number } | null = null;
      for (const ip of ips) {
        for (const p of ports) {
          if (await canConnect(ip, p)) {
            chosen = { ip, port: p };
            break;
          }
        }
        if (chosen) break;
      }

      if (chosen) {
        connectHost = chosen.ip;
        connectPort = chosen.port;
        servername = host;
        console.log(`[EmailService] Using ${host} via ${chosen.ip}:${chosen.port}`);
      } else {
        console.warn('[EmailService] No reachable SMTP2GO IP/port found — using configured host/port directly');
        connectHost = host;
        connectPort = port;
      }
    } catch (error: any) {
      console.warn(
        `[EmailService] DNS lookup failed for ${host} (${error.code || error.message}) — using hostname directly`,
      );
    }

    this.transporter = nodemailer.createTransport({
      host: connectHost,
      port: connectPort,
      secure: connectPort === 465,
      requireTLS: connectPort !== 465,
      auth: { user, pass },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
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

  /**
   * Sends a gzipped JSON database backup file as an email attachment.
   */
  async sendBackupEmail(to: string, filename: string, buffer: Buffer, tableCounts: Record<string, number>): Promise<void> {
    const subject = `Database Backup — ${new Date().toISOString().split('T')[0]}`;

    const countsHtml = Object.entries(tableCounts)
      .map(([table, count]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid rgba(255,255,255,0.08);color:#d1d5db;font-size:13px;">${table}</td><td style="padding:6px 12px;border-bottom:1px solid rgba(255,255,255,0.08);color:#22d3ee;font-size:13px;text-align:right;">${count < 0 ? 'error' : count}</td></tr>`)
      .join('');

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;padding:24px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0d1428;border-radius:12px;border:1px solid #1e2a45;">
        <tr><td style="padding:24px 32px;border-bottom:2px solid #22d3ee;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;">Woven Model — Database Backup</h1>
          <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">${filename}</p>
        </td></tr>
        <tr><td style="padding:20px 32px;">
          <p style="margin:0 0 16px;color:#d1d5db;font-size:14px;">The full database backup is attached as a gzipped JSON file. Table row counts:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111b36;border-radius:8px;">
            ${countsHtml}
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px;background-color:#0a0f1e;border-radius:0 0 12px 12px;">
          <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Woven Model. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    if (this.transportReady) {
      try {
        await this.transportReady;
      } catch (error: any) {
        console.error('[EmailService] SMTP transport init failed:', error.message);
        await this.logEmail(to, subject, 'database_backup', 'failed', `Transport init failed: ${error.message}`);
        return;
      }
    }

    if (this.useConsoleFallback || !this.transporter) {
      console.log(`[EmailService] TO: ${to}`);
      console.log(`[EmailService] SUBJECT: ${subject}`);
      await this.logEmail(to, subject, 'database_backup', 'sent');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: { name: 'Woven Model', address: env.SMTP_FROM || 'noreply@wovenmodel.com' },
        to,
        replyTo: env.SMTP_REPLY_TO || 'sales@wovenmodel.com',
        subject,
        html,
        attachments: [
          {
            filename,
            content: buffer,
            contentType: 'application/gzip',
          },
        ],
      });

      console.log(`[EmailService] Backup emailed: ${filename} -> ${to} (${info.messageId})`);
      await this.logEmail(to, subject, 'database_backup', 'sent');
    } catch (error: any) {
      console.error('[EmailService] Failed to email backup:', error.message);
      await this.logEmail(to, subject, 'database_backup', 'failed', error.message);
    }
  }
}

export const emailService = new EmailService();
