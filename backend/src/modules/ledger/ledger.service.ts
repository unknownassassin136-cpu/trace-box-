import crypto from 'crypto';
import { db } from '../../db';
import { ledgerEntries, events } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';

export class LedgerService {
  /**
   * Serializes an event payload deterministically for hashing.
   */
  public static canonicalizePayload(payload: any): string {
    if (typeof payload !== 'object' || payload === null) {
      return String(payload);
    }
    const keys = Object.keys(payload).sort();
    const sortedObj: any = {};
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'object' && value !== null) {
        sortedObj[key] = this.canonicalizePayload(value);
      } else {
        sortedObj[key] = value;
      }
    }
    return JSON.stringify(sortedObj);
  }

  /**
   * Generates the SHA-256 hash for a new ledger entry.
   */
  public static generateEventHash(payload: any, previousHash: string): string {
    const canonicalPayload = this.canonicalizePayload(payload);
    const dataToHash = `${canonicalPayload}${previousHash}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Fetches the most recent hash from the ledger.
   * If the ledger is empty, returns the genesis hash.
   */
  public static async getLatestHash(): Promise<string> {
    const latestEntry = await db.select()
      .from(ledgerEntries)
      .orderBy(desc(ledgerEntries.ledgerSequence))
      .limit(1);

    if (latestEntry.length === 0) {
      // Genesis block hash (all zeros)
      return '0000000000000000000000000000000000000000000000000000000000000000';
    }
    return latestEntry[0].eventHash;
  }

  /**
   * Appends a new event to the cryptographic ledger.
   */
  public static async appendToLedger(eventId: string, payload: any): Promise<string> {
    const previousHash = await this.getLatestHash();
    const canonicalPayload = this.canonicalizePayload(payload);
    const eventHash = this.generateEventHash(payload, previousHash);

    // Insert into ledger_entries
    await db.insert(ledgerEntries).values({
      eventId: eventId,
      previousHash: previousHash,
      eventHash: eventHash,
      canonicalPayload: canonicalPayload
    });

    // Also update the event's hash reference in the events table
    await db.update(events)
      .set({ previousHash, eventHash })
      .where(eq(events.eventId, eventId));

    return eventHash;
  }
}
