import * as fs from 'fs';
import * as path from 'path';
import { ISequenceManagerPort, PartnerId } from '../../domain/ports';

/**
 * File-based implementation of sequence manager.
 * Persists sequence numbers to a JSON file for data survival across server restarts.
 */
export class FileSequenceManager implements ISequenceManagerPort {
  private sequences: Map<PartnerId, number> = new Map();
  private readonly filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly debounceMs = 100; // Quick saves for sequence numbers

  constructor(dataDir: string = './data') {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'sequences.json');
    this.loadFromFile();
  }

  /**
   * Load sequences from file on startup
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const sequences: Record<string, number> = JSON.parse(data);
        
        for (const [partnerId, seq] of Object.entries(sequences)) {
          this.sequences.set(partnerId as PartnerId, seq);
        }
        console.log(`📂 Loaded sequences from ${this.filePath}:`, Object.fromEntries(this.sequences));
      } else {
        console.log(`📂 No existing sequence file found. Starting from 0.`);
      }
    } catch (error) {
      console.error(`❌ Error loading sequences from file:`, error);
    }
  }

  /**
   * Schedule a debounced save to file
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToFile();
    }, this.debounceMs);
  }

  /**
   * Immediately save sequences to file
   */
  private saveToFile(): void {
    try {
      const sequences = Object.fromEntries(this.sequences);
      fs.writeFileSync(this.filePath, JSON.stringify(sequences, null, 2), 'utf-8');
    } catch (error) {
      console.error(`❌ Error saving sequences to file:`, error);
    }
  }

  /**
   * Force immediate save (call on shutdown)
   */
  flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveToFile();
  }

  /**
   * Get the next sequence number for a partner and atomically increment.
   */
  getNextSequence(partnerId: PartnerId): number {
    const current = this.sequences.get(partnerId) ?? 0;
    const next = current + 1;
    this.sequences.set(partnerId, next);
    this.scheduleSave();
    return next;
  }

  /**
   * Get current sequence number without incrementing.
   */
  getCurrentSequence(partnerId: PartnerId): number {
    return this.sequences.get(partnerId) ?? 0;
  }

  /**
   * Reset sequence for a specific partner.
   */
  resetSequence(partnerId: PartnerId): void {
    this.sequences.delete(partnerId);
    this.scheduleSave();
  }

  /**
   * Reset all sequences.
   */
  resetAll(): void {
    this.sequences.clear();
    this.scheduleSave();
  }
}
