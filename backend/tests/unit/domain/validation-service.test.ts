import { ValidationService } from '../../../src/domain/services/validation-service';
import { PartnerId } from '../../../src/domain/models';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validatePartnerA', () => {
    it('should validate valid Partner A input', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = service.validatePartnerA(input);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid Partner A input', () => {
      const input = {
        orderId: 'ORD-001',
        // Missing required fields
      };

      const result = service.validatePartnerA(input);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePartnerB', () => {
    it('should validate valid Partner B input', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = service.validatePartnerB(input);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid Partner B input', () => {
      const input = {
        transactionId: 'TXN-001',
        // Missing required fields
      };

      const result = service.validatePartnerB(input);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateByPartner', () => {
    it('should route Partner A validation correctly', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = service.validateByPartner(PartnerId.PARTNER_A, input);

      expect(result.isValid).toBe(true);
    });

    it('should route Partner B validation correctly', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = service.validateByPartner(PartnerId.PARTNER_B, input);

      expect(result.isValid).toBe(true);
    });

    it('should return error for unknown partner', () => {
      const input = {};

      const result = service.validateByPartner('UNKNOWN' as PartnerId, input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'partnerId',
          message: expect.stringContaining('Unknown partner')
        })
      );
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple inputs and return results with indices', () => {
      const inputs = [
        {
          orderId: 'ORD-001',
          skuId: 'SKU-12345',
          customerId: 'CUST-001',
          quantity: 5,
          unitPrice: 29.99,
          taxRate: 0.1,
          transactionTimeMs: Date.now()
        },
        {
          orderId: 'ORD-002',
          skuId: 'SKU-67890',
          customerId: 'CUST-002',
          quantity: 10,
          unitPrice: 15.00,
          taxRate: 0.05,
          transactionTimeMs: Date.now()
        },
        {
          orderId: 'ORD-003',
          // Invalid - missing fields
        }
      ];

      const results = service.validateBatch(PartnerId.PARTNER_A, inputs);

      expect(results).toHaveLength(3);
      expect(results[0].index).toBe(0);
      expect(results[0].result.isValid).toBe(true);
      expect(results[1].index).toBe(1);
      expect(results[1].result.isValid).toBe(true);
      expect(results[2].index).toBe(2);
      expect(results[2].result.isValid).toBe(false);
    });

    it('should handle empty batch', () => {
      const results = service.validateBatch(PartnerId.PARTNER_A, []);

      expect(results).toHaveLength(0);
    });
  });
});
