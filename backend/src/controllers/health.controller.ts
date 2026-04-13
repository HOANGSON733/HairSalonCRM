import { Request, Response } from 'express';
import { config } from '../config';
import { currentDb } from '../lib/db';

export async function health(_req: Request, res: Response) {
  try {
    await currentDb().command({ ping: 1 });
    return res.json({ ok: true, db: config.dbName });
  } catch (_error) {
    return res.status(500).json({ ok: false, message: 'MongoDB not available' });
  }
}
