import gzip from 'zlib';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { emailService } from './emailService';

const prisma = new PrismaClient();

// All models in schema.prisma (maps to the "purchase_*" tables)
const MODELS = [
  'customer',
  'product',
  'cartItem',
  'order',
  'orderItem',
  'invoice',
  'payment',
  'license',
  'subscription',
  'coupon',
  'orderEvent',
  'productReview',
  'supportRequest',
  'emailTemplate',
  'emailLog',
  'notification',
  'auditLog',
  'download',
] as const;

type ModelName = (typeof MODELS)[number];

async function readTable(model: ModelName): Promise<{ count: number; rows: unknown[] }> {
  const rows = await (prisma as any)[model].findMany();
  return { count: rows.length, rows };
}

/**
 * Builds a full database backup (all tables -> gzipped JSON) using read-only
 * Prisma queries. Never modifies the database.
 */
export async function generateBackup(): Promise<{ filename: string; buffer: Buffer; tableCounts: Record<string, number> }> {
  const tables: Record<string, unknown[]> = {};
  const tableCounts: Record<string, number> = {};

  for (const model of MODELS) {
    try {
      const { count, rows } = await readTable(model);
      tables[model] = rows;
      tableCounts[model] = count;
    } catch (error: any) {
      console.error(`[BackupService] Failed to read ${model}:`, error.message);
      tables[model] = [];
      tableCounts[model] = -1;
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    application: 'woven-model-purchase-system',
    tables,
  };

  const json = JSON.stringify(payload, null, 2);
  const buffer = gzip.gzipSync(Buffer.from(json, 'utf8'));
  const filename = `woven-model-purchase-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json.gz`;

  return { filename, buffer, tableCounts };
}

/**
 * Generates a backup and emails it to BACKUP_EMAIL (default ceo@wovenmodel.com).
 */
export async function runBackup(): Promise<{
  ok: boolean;
  filename?: string;
  sizeBytes?: number;
  tableCounts?: Record<string, number>;
  error?: string;
}> {
  try {
    const backup = await generateBackup();
    await emailService.sendBackupEmail(env.BACKUP_EMAIL, backup.filename, backup.buffer, backup.tableCounts);
    console.log(
      `[BackupService] Backup emailed to ${env.BACKUP_EMAIL} (${backup.filename}, ${backup.buffer.length} bytes)`,
    );
    return { ok: true, filename: backup.filename, sizeBytes: backup.buffer.length, tableCounts: backup.tableCounts };
  } catch (error: any) {
    console.error('[BackupService] Backup failed:', error.message);
    return { ok: false, error: error.message };
  }
}

let schedulerStarted = false;

/**
 * Schedules daily database backups (first one 60s after startup, then every 24h).
 */
export function startScheduledBackups(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const run = () => {
    runBackup().catch((err) => console.error('[BackupService] Scheduled backup error:', err.message));
  };

  const FIRST_DELAY_MS = 60_000;
  const INTERVAL_MS = 24 * 60 * 60 * 1000;

  setTimeout(run, FIRST_DELAY_MS);
  setInterval(run, INTERVAL_MS);

  console.log(`[BackupService] Scheduled backups enabled — daily email to ${env.BACKUP_EMAIL}`);
}
