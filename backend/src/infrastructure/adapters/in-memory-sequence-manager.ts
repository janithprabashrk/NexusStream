import { ISequenceManagerPort, PartnerId } from '../../domain/ports';

/**
 * In-memory implementation of sequence manager.
 * Tracks per-partner sequence numbers starting at 1.
 * Thread-safe for single-process Node.js environment.
 */
export class InMemorySequenceManager implements ISequenceManagerPort {
  private sequences: Map<PartnerId, number> = new Map();

  /**
   * Get the next sequence number for a partner and atomically increment.
   * Sequence numbers start at 1 for each partner.
   */
  getNextSequence(partnerId: PartnerId): number {
    const current = this.sequences.get(partnerId) ?? 0;
    const next = current + 1;
    this.sequences.set(partnerId, next);
    return next;
  }

  /**
   * Get current sequence number without incrementing.
   * Returns 0 if no sequences have been issued for the partner.
   */
  getCurrentSequence(partnerId: PartnerId): number {
    return this.sequences.get(partnerId) ?? 0;
  }

  /**
   * Reset sequence for a specific partner (useful for testing).
   */
  resetSequence(partnerId: PartnerId): void {
    this.sequences.delete(partnerId);
  }

  /**
   * Reset all sequences (useful for testing).
   */
  resetAll(): void {
    this.sequences.clear();
  }
}
