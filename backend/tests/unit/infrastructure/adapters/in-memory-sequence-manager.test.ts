import { InMemorySequenceManager } from '../../../../src/infrastructure/adapters/in-memory-sequence-manager';
import { PartnerId } from '../../../../src/domain/ports';

describe('InMemorySequenceManager', () => {
  let sequenceManager: InMemorySequenceManager;

  beforeEach(() => {
    sequenceManager = new InMemorySequenceManager();
  });

  describe('getNextSequence', () => {
    it('should start sequence at 1 for a new partner', () => {
      const seq = sequenceManager.getNextSequence(PartnerId.PARTNER_A);
      expect(seq).toBe(1);
    });

    it('should increment sequence on each call', () => {
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(1);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(2);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(3);
    });

    it('should maintain separate sequences per partner', () => {
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(1);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(2);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_B)).toBe(1);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(3);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_B)).toBe(2);
    });

    it('should handle large sequence numbers', () => {
      for (let i = 1; i <= 1000; i++) {
        expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(i);
      }
    });
  });

  describe('getCurrentSequence', () => {
    it('should return 0 for partner with no sequences', () => {
      expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_A)).toBe(0);
    });

    it('should return current sequence without incrementing', () => {
      sequenceManager.getNextSequence(PartnerId.PARTNER_A);
      sequenceManager.getNextSequence(PartnerId.PARTNER_A);
      
      expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_A)).toBe(2);
      expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_A)).toBe(2);
    });
  });

  describe('resetSequence', () => {
    it('should reset sequence for specific partner', () => {
      sequenceManager.getNextSequence(PartnerId.PARTNER_A);
      sequenceManager.getNextSequence(PartnerId.PARTNER_A);
      sequenceManager.getNextSequence(PartnerId.PARTNER_B);

      sequenceManager.resetSequence(PartnerId.PARTNER_A);

      expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_A)).toBe(0);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(1);
      expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_B)).toBe(1);
    });
  });

  describe('resetAll', () => {
    it('should reset sequences for all partners', () => {
      sequenceManager.getNextSequence(PartnerId.PARTNER_A);
      sequenceManager.getNextSequence(PartnerId.PARTNER_A);
      sequenceManager.getNextSequence(PartnerId.PARTNER_B);
      sequenceManager.getNextSequence(PartnerId.PARTNER_B);

      sequenceManager.resetAll();

      expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_A)).toBe(0);
      expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_B)).toBe(0);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_A)).toBe(1);
      expect(sequenceManager.getNextSequence(PartnerId.PARTNER_B)).toBe(1);
    });
  });
});
