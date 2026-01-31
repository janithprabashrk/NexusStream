import { PartnerBValidator } from '../../../src/domain/services/partner-b-validator';
import { PartnerBInput } from '../../../src/domain/models';

describe('PartnerBValidator', () => {
  let validator: PartnerBValidator;

  beforeEach(() => {
    validator = new PartnerBValidator();
  });

  // ============ Valid Input Tests ============

  describe('Valid Input', () => {
    it('should validate a complete valid Partner B input', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(input);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate input with optional notes', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-002',
        itemCode: 'ITEM-67890',
        clientId: 'CLIENT-002',
        qty: 1,
        price: 100.00,
        tax: 5,
        purchaseTime: '2024-01-15T10:30:00.000Z',
        notes: 'Express shipping requested'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.data?.notes).toBe('Express shipping requested');
    });

    it('should validate input with zero tax', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-003',
        itemCode: 'ITEM-TAX-FREE',
        clientId: 'CLIENT-003',
        qty: 10,
        price: 15.50,
        tax: 0,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
      expect(result.data?.tax).toBe(0);
    });

    it('should validate input with maximum tax of 100%', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-004',
        itemCode: 'ITEM-HIGH-TAX',
        clientId: 'CLIENT-004',
        qty: 2,
        price: 50.00,
        tax: 100,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(true);
    });

    it('should validate various ISO 8601 timestamp formats', () => {
      const timestamps = [
        '2024-01-15T10:30:00.000Z',
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00+00:00',
        '2024-01-15T15:30:00+05:00'
      ];

      timestamps.forEach(timestamp => {
        const input: PartnerBInput = {
          transactionId: 'TXN-001',
          itemCode: 'ITEM-12345',
          clientId: 'CLIENT-001',
          qty: 5,
          price: 29.99,
          tax: 10,
          purchaseTime: timestamp
        };

        const result = validator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });
  });

  // ============ Missing Required Fields Tests ============

  describe('Missing Required Fields', () => {
    it('should fail validation when transactionId is missing', () => {
      const input = {
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'transactionId' })
      );
    });

    it('should fail validation when itemCode is missing', () => {
      const input = {
        transactionId: 'TXN-001',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'itemCode' })
      );
    });

    it('should fail validation when clientId is missing', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'clientId' })
      );
    });

    it('should fail validation when qty is missing', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'qty' })
      );
    });

    it('should fail validation when purchaseTime is missing', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'purchaseTime' })
      );
    });
  });

  // ============ Null Value Tests ============

  describe('Null Values', () => {
    it('should fail validation when transactionId is null', () => {
      const input = {
        transactionId: null,
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when qty is null', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: null,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });
  });

  // ============ Invalid Data Type Tests ============

  describe('Invalid Data Types', () => {
    it('should fail validation when transactionId is a number', () => {
      const input = {
        transactionId: 12345,
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'transactionId',
          expectedType: 'string'
        })
      );
    });

    it('should fail validation when qty is a string', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: '5',
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when notes is a number', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z',
        notes: 12345
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'notes' })
      );
    });
  });

  // ============ Numeric Validation Tests ============

  describe('Numeric Validations', () => {
    it('should fail validation when qty is zero', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 0,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when qty is negative', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: -5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when qty is a decimal', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5.5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when price is zero', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 0,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when price is negative', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: -29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when tax is negative', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: -10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when tax exceeds 100', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 150,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });
  });

  // ============ Timestamp Validation Tests ============

  describe('Timestamp Validations', () => {
    it('should fail validation when purchaseTime is invalid format', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: 'invalid-date'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'purchaseTime' })
      );
    });

    it('should fail validation when purchaseTime is a number', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: Date.now()
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation when purchaseTime is malformed', () => {
      const input = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-13-45T99:99:99.000Z'
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
    });

    it('should fail validation for undefined input', () => {
      const result = validator.validate(undefined);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation for array input', () => {
      const result = validator.validate([{ transactionId: 'TXN-001' }]);

      expect(result.isValid).toBe(false);
    });

    it('should fail validation for empty string transactionId', () => {
      const input = {
        transactionId: '',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 29.99,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = validator.validate(input);

      expect(result.isValid).toBe(false);
    });
  });
});
