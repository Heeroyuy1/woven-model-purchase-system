import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { runBackup } from '../services/backupService';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// POST /api/admin/backup — generate + email a database backup immediately
router.post('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runBackup();
    if (result.ok) {
      res.json({ message: 'Backup generated and emailed', filename: result.filename, sizeBytes: result.sizeBytes, tableCounts: result.tableCounts });
    } else {
      res.status(500).json({ error: 'Backup failed', details: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Backup failed', details: error.message });
  }
});

export default router;
