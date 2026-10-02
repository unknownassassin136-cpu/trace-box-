import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { ledgerEntries, events } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Fetch ledger entries with their associated events
    const entries = await db.select({
      seq: ledgerEntries.ledgerSequence,
      timestamp: ledgerEntries.createdAt,
      type: events.eventType,
      device: events.deviceId,
      hash: ledgerEntries.eventHash
    })
    .from(ledgerEntries)
    .innerJoin(events, eq(ledgerEntries.eventId, events.eventId))
    .orderBy(desc(ledgerEntries.ledgerSequence))
    .limit(50);

    res.json(entries);
  } catch (error) {
    console.error('Failed to fetch ledger:', error);
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
});

export default router;
