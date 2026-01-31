import { PartnerAValidator } from '../../../src/domain/services/partner-a-validator';
import { PartnerAInput } from '../../../src/domain/models';

describe('PartnerAValidator', () => {
  let validator: PartnerAValidator;

  beforeEach(() => {
    validator = new PartnerAValidator();
  });

  // ============ Valid Input Tests ============

  describe('Valid Input', () => {
    it('should validate a complete valid Partner A input', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(input);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate input with optional metadata', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-002',
        skuId: 'SKU-67890',
        customerId: 'CUST-002',
        quantity: 1,
        unitPrice: 100.00,
        taxRate: 0.05,
        transactionTimeMs: Date.now(),
        metadata: { source: 'web', campaign: 'summer_sale' }
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(input);
      expect(result.data?.metadata).toEqual({ source: 'web', campaign: 'summer_sale' });
    });

    it('should validate input with zero tax rate', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-003',
        skuId: 'SKU-TAX-FREE',
        customerId: 'CUST-003',
        quantity: 10,
        unitPrice: 15.50,
        taxRate: 0,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.data?.taxRate).toBe(0);
    });

    it('should validate input with maximum tax rate of 1 (100%)', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-004',
        skuId: 'SKU-HIGH-TAX',
        customerId: 'CUST-004',
        quantity: 2,
        unitPrice: 50.00,
        taxRate: 1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
    });
  });

  // ============ Missing Required Fields Tests ============

  describe('Missing Required Fields', () => {
    it('should fail validation when orderId is missing', () => {
      const input = {
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'orderId' })
      );
    });

    it('should fail validation when skuId is missing', () => {
      const input = {
        orderId: 'ORD-001',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'skuId' })
      );
    });

    it('should fail validation when customerId is missing', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'customerId' })
      );
    });

    it('should fail validation when quantity is missing', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'quantity' })
      );
    });

    it('should fail validation when multiple fields are missing', () => {
      const input = {
        orderId: 'ORD-001',
        quantity: 5
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  // ============ Null Value Tests ============

  describe('Null Values', () => {
    it('should fail validation when orderId is null', () => {
      const input = {
        orderId: null,
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          field: 'orderId',
          message: expect.stringContaining('null')
        })
      );
    });

    it('should fail validation when quantity is null', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: null,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });
  });

  // ============ Invalid Data Type Tests ============

  describe('Invalid Data Types', () => {
    it('should fail validation when orderId is a number instead of string', () => {
      const input = {
        orderId: 12345,
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'orderId',
          expectedType: 'string'
        })
      );
    });

    it('should fail validation when quantity is a string instead of number', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: '5',
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'quantity' })
      );
    });

    it('should fail validation when unitPrice is a string', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: '29.99',
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'unitPrice' })
      );
    });

    it('should fail validation when metadata is an array instead of object', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now(),
        metadata: ['invalid', 'array']
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'metadata' })
      );
    });
  });

  // ============ Numeric Validation Tests ============

  describe('Numeric Validations', () => {
    it('should fail validation when quantity is zero', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 0,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quantity',
          message: expect.stringContaining('positive')
        })
      );
    });

    it('should fail validation when quantity is negative', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: -5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when quantity is a decimal', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5.5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quantity',
          message: expect.stringContaining('integer')
        })
      );
    });

    it('should fail validation when unitPrice is zero', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 0,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when unitPrice is negative', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: -29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when taxRate is negative', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: -0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when taxRate exceeds 1 (100%)', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 1.5,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when quantity is NaN', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: NaN,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });
  });

  // ============ Timestamp Validation Tests ============

  describe('Timestamp Validations', () => {
    it('should validate a current timestamp', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
    });

    it('should validate a past timestamp (year 2020)', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: new Date('2020-06-15').getTime()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation when timestamp is a string', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when timestamp is too old (before year 2000)', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: new Date('1990-01-01').getTime()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });
  });

  // ============ Edge Cases ============

  describe('Edge Cases', () => {
    it('should fail validation for null input', () => {
      const result = validator.validate(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'root' })
      );
    });

    it('should fail validation for undefined input', () => {
      const result = validator.validate(undefined);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation for array input', () => {
      const result = validator.validate([{ orderId: 'ORD-001' }]);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation for primitive input', () => {
      const result = validator.validate('invalid string input');

      expect(result.isValid).toBe(false);
    });

    it('should fail validation for empty string orderId', () => {
      const input = {
        orderId: '',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation for whitespace-only orderId', () => {
      const input = {
        orderId: '   ',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 29.99,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });
  });
});
