import { PartnerId } from '../models';

/**
 * Port interface for sequence number management
 * Tracks per-partner sequence numbers starting at 1
 */
export interface ISequenceManagerPort {
  /** Get next sequence number for a partner (auto-increments) */
  getNextSequence(partnerId: PartnerId): number;
  
  /** Get current sequence number without incrementing */
  getCurrentSequence(partnerId: PartnerId): number;
  
  /** Reset sequence for a partner (for testing) */
  resetSequence(partnerId: PartnerId): void;
  
  /** Reset all sequences (for testing) */
  resetAll(): void;
}
