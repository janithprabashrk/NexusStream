import { OrderTransformer } from '../../../src/domain/services/order-transformer';
import { PartnerAInput, PartnerBInput, PartnerId } from '../../../src/domain/models';

describe('OrderTransformer', () => {
  let transformer: OrderTransformer;

  beforeEach(() => {
    transformer = new OrderTransformer();
  });

  // ============ Partner A Transformation Tests ============

  describe('Partner A Transformation', () => {
    it('should correctly transform Partner A input to OrderEvent', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1, // 10%
        transactionTimeMs: 1705315800000 // 2024-01-15T10:30:00.000Z
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.id).toBeDefined();
      expect(result.externalOrderId).toBe('ORD-001');
      expect(result.partnerId).toBe(PartnerId.PARTNER_A);
      expect(result.sequenceNumber).toBe(1);
      expect(result.productId).toBe('SKU-12345');
      expect(result.customerId).toBe('CUST-001');
      expect(result.quantity).toBe(5);
      expect(result.unitPrice).toBe(20.00);
      expect(result.taxRate).toBe(0.1);
    });

    it('should correctly calculate grossAmount (quantity * unitPrice)', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.grossAmount).toBe(100.00); // 5 * 20.00
    });

    it('should correctly calculate taxAmount (grossAmount * taxRate)', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1, // 10%
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.taxAmount).toBe(10.00); // 100.00 * 0.1
    });

    it('should correctly calculate netAmount (grossAmount + taxAmount)', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.netAmount).toBe(110.00); // 100.00 + 10.00
    });

    it('should convert milliseconds timestamp to ISO 8601', () => {
      const timestamp = 1705315800000; // Known timestamp
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: timestamp
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.transactionTime).toBe(new Date(timestamp).toISOString());
      expect(result.transactionTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should generate a unique UUID for each order', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result1 = transformer.fromPartnerA(input, 1);
      const result2 = transformer.fromPartnerA(input, 2);

      expect(result1.id).not.toBe(result2.id);
      // UUID v4 format check
      expect(result1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should preserve metadata when present', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now(),
        metadata: { source: 'web', campaign: 'summer_sale' }
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.metadata).toEqual({ source: 'web', campaign: 'summer_sale' });
    });

    it('should handle zero tax rate correctly', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0,
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.taxRate).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.netAmount).toBe(100.00); // grossAmount only
    });

    it('should set processedAt timestamp', () => {
      const before = new Date();
      
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);
      
      const after = new Date();
      const processedAt = new Date(result.processedAt);

      expect(processedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(processedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ============ Partner B Transformation Tests ============

  describe('Partner B Transformation', () => {
    it('should correctly transform Partner B input to OrderEvent', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 20.00,
        tax: 10, // 10% as percentage
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = transformer.fromPartnerB(input, 1);

      expect(result.id).toBeDefined();
      expect(result.externalOrderId).toBe('TXN-001');
      expect(result.partnerId).toBe(PartnerId.PARTNER_B);
      expect(result.sequenceNumber).toBe(1);
      expect(result.productId).toBe('ITEM-12345');
      expect(result.customerId).toBe('CLIENT-001');
      expect(result.quantity).toBe(5);
      expect(result.unitPrice).toBe(20.00);
    });

    it('should convert percentage tax to decimal (10 -> 0.1)', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 20.00,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = transformer.fromPartnerB(input, 1);

      expect(result.taxRate).toBe(0.1); // 10% converted to 0.1
    });

    it('should correctly map Partner B field names', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',     // -> externalOrderId
        itemCode: 'ITEM-12345',        // -> productId
        clientId: 'CLIENT-001',        // -> customerId
        qty: 5,                        // -> quantity
        price: 20.00,                  // -> unitPrice
        tax: 10,                       // -> taxRate (converted)
        purchaseTime: '2024-01-15T10:30:00.000Z'  // -> transactionTime
      };

      const result = transformer.fromPartnerB(input, 1);

      expect(result.externalOrderId).toBe('TXN-001');
      expect(result.productId).toBe('ITEM-12345');
      expect(result.customerId).toBe('CLIENT-001');
      expect(result.quantity).toBe(5);
      expect(result.unitPrice).toBe(20.00);
    });

    it('should normalize ISO 8601 timestamp to consistent format', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 20.00,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00+00:00'
      };

      const result = transformer.fromPartnerB(input, 1);

      expect(result.transactionTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should include notes in metadata when present', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 20.00,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z',
        notes: 'Express shipping requested'
      };

      const result = transformer.fromPartnerB(input, 1);

      expect(result.metadata).toEqual({ notes: 'Express shipping requested' });
    });

    it('should correctly calculate amounts with percentage tax', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 20.00,
        tax: 15, // 15%
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = transformer.fromPartnerB(input, 1);

      expect(result.grossAmount).toBe(100.00);   // 5 * 20.00
      expect(result.taxRate).toBe(0.15);         // 15% -> 0.15
      expect(result.taxAmount).toBe(15.00);      // 100.00 * 0.15
      expect(result.netAmount).toBe(115.00);     // 100.00 + 15.00
    });
  });

  // ============ Calculation Tests ============

  describe('Amount Calculations', () => {
    it('should round amounts to two decimal places', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 3,
        unitPrice: 9.99,
        taxRate: 0.0725, // 7.25%
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      // 3 * 9.99 = 29.97
      expect(result.grossAmount).toBe(29.97);
      // 29.97 * 0.0725 = 2.172825
      expect(result.taxAmount).toBe(2.17);
      // 29.97 + 2.17 = 32.14
      expect(result.netAmount).toBe(32.14);
    });

    it('should handle large quantities correctly', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 1000,
        unitPrice: 99.99,
        taxRate: 0.2,
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.grossAmount).toBe(99990.00);
      expect(result.taxAmount).toBe(19998.00);
      expect(result.netAmount).toBe(119988.00);
    });

    it('should handle small prices correctly', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 1,
        unitPrice: 0.01,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.grossAmount).toBe(0.01);
      expect(result.taxAmount).toBe(0);
      expect(result.netAmount).toBe(0.01);
    });
  });

  // ============ Sequence Number Tests ============

  describe('Sequence Number', () => {
    it('should correctly assign sequence number for Partner A', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result1 = transformer.fromPartnerA(input, 1);
      const result2 = transformer.fromPartnerA(input, 42);
      const result3 = transformer.fromPartnerA(input, 1000);

      expect(result1.sequenceNumber).toBe(1);
      expect(result2.sequenceNumber).toBe(42);
      expect(result3.sequenceNumber).toBe(1000);
    });

    it('should correctly assign sequence number for Partner B', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 20.00,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result1 = transformer.fromPartnerB(input, 1);
      const result2 = transformer.fromPartnerB(input, 99);

      expect(result1.sequenceNumber).toBe(1);
      expect(result2.sequenceNumber).toBe(99);
    });
  });

  // ============ Generic Transform Method Tests ============

  describe('Generic Transform Method', () => {
    it('should transform Partner A input using generic method', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 5,
        unitPrice: 20.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = transformer.transform(PartnerId.PARTNER_A, input, 1);

      expect(result.partnerId).toBe(PartnerId.PARTNER_A);
      expect(result.externalOrderId).toBe('ORD-001');
    });

    it('should transform Partner B input using generic method', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 5,
        price: 20.00,
        tax: 10,
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = transformer.transform(PartnerId.PARTNER_B, input, 1);

      expect(result.partnerId).toBe(PartnerId.PARTNER_B);
      expect(result.externalOrderId).toBe('TXN-001');
    });

    it('should throw error for unknown partner ID', () => {
      const input = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345'
      };

      expect(() => {
        transformer.transform('UNKNOWN_PARTNER' as PartnerId, input as PartnerAInput, 1);
      }).toThrow('Unknown partner ID');
    });
  });

  // ============ Edge Cases ============

  describe('Edge Cases', () => {
    it('should handle quantity of 1 correctly', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 1,
        unitPrice: 100.00,
        taxRate: 0.1,
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.grossAmount).toBe(100.00);
      expect(result.taxAmount).toBe(10.00);
      expect(result.netAmount).toBe(110.00);
    });

    it('should handle 100% tax rate correctly', () => {
      const input: PartnerAInput = {
        orderId: 'ORD-001',
        skuId: 'SKU-12345',
        customerId: 'CUST-001',
        quantity: 1,
        unitPrice: 100.00,
        taxRate: 1, // 100%
        transactionTimeMs: Date.now()
      };

      const result = transformer.fromPartnerA(input, 1);

      expect(result.taxAmount).toBe(100.00);
      expect(result.netAmount).toBe(200.00);
    });

    it('should handle Partner B with 100% tax', () => {
      const input: PartnerBInput = {
        transactionId: 'TXN-001',
        itemCode: 'ITEM-12345',
        clientId: 'CLIENT-001',
        qty: 1,
        price: 100.00,
        tax: 100, // 100%
        purchaseTime: '2024-01-15T10:30:00.000Z'
      };

      const result = transformer.fromPartnerB(input, 1);

      expect(result.taxRate).toBe(1);
      expect(result.taxAmount).toBe(100.00);
      expect(result.netAmount).toBe(200.00);
    });
  });
});
