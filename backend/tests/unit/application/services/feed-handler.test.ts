import { FeedHandler, FeedProcessingResult } from '../../../../src/application/services/feed-handler';
import { ValidationService } from '../../../../src/domain/services/validation-service';
import { OrderTransformer } from '../../../../src/domain/services/order-transformer';
import { InMemoryOrderStream } from '../../../../src/infrastructure/adapters/in-memory-order-stream';
import { InMemorySequenceManager } from '../../../../src/infrastructure/adapters/in-memory-sequence-manager';
import { PartnerAInput, PartnerBInput, PartnerId } from '../../../../src/domain/models';

describe('FeedHandler', () => {
  let feedHandler: FeedHandler;
  let orderStream: InMemoryOrderStream;
  let sequenceManager: InMemorySequenceManager;

  const validPartnerAInput: PartnerAInput = {
    orderId: 'ORD-A-001',
    skuId: 'SKU-123',
    customerId: 'CUST-001',
    quantity: 5,
    unitPrice: 19.99,
    taxRate: 0.08,
    transactionTimeMs: Date.now(),
  };

  const validPartnerBInput: PartnerBInput = {
    transactionId: 'TXN-B-001',
    itemCode: 'ITEM-456',
    clientId: 'CLIENT-001',
    qty: 3,
    price: 29.99,
    tax: 8.5,
    purchaseTime: new Date().toISOString(),
  };

  beforeEach(() => {
    orderStream = new InMemoryOrderStream();
    sequenceManager = new InMemorySequenceManager();
    const validationService = new ValidationService();
    const transformer = new OrderTransformer();

    feedHandler = new FeedHandler(
      validationService,
      transformer,
      orderStream,
      sequenceManager
    );
  });

  afterEach(() => {
    orderStream.removeAllListeners();
  });

  describe('processPartnerAOrder', () => {
    describe('valid orders', () => {
      it('should process valid Partner A order successfully', () => {
        const result = feedHandler.processPartnerAOrder(validPartnerAInput);

        expect(result.success).toBe(true);
        expect(result.orderId).toBe('ORD-A-001');
        expect(result.partnerId).toBe(PartnerId.PARTNER_A);
        expect(result.sequenceNumber).toBe(1);
        expect(result.errors).toBeUndefined();
      });

      it('should emit valid order to stream', () => {
        feedHandler.processPartnerAOrder(validPartnerAInput);

        const history = orderStream.getValidOrderHistory();
        expect(history.length).toBe(1);
        expect(history[0].orderEvent.externalOrderId).toBe('ORD-A-001');
        expect(history[0].orderEvent.partnerId).toBe(PartnerId.PARTNER_A);
        expect(history[0].orderEvent.sequenceNumber).toBe(1);
      });

      it('should increment sequence for each valid order', () => {
        const result1 = feedHandler.processPartnerAOrder(validPartnerAInput);
        const result2 = feedHandler.processPartnerAOrder({ ...validPartnerAInput, orderId: 'ORD-A-002' });
        const result3 = feedHandler.processPartnerAOrder({ ...validPartnerAInput, orderId: 'ORD-A-003' });

        expect(result1.sequenceNumber).toBe(1);
        expect(result2.sequenceNumber).toBe(2);
        expect(result3.sequenceNumber).toBe(3);
      });

      it('should correctly transform order fields', () => {
        feedHandler.processPartnerAOrder(validPartnerAInput);

        const history = orderStream.getValidOrderHistory();
        const orderEvent = history[0].orderEvent;

        expect(orderEvent.productId).toBe('SKU-123');
        expect(orderEvent.customerId).toBe('CUST-001');
        expect(orderEvent.quantity).toBe(5);
        expect(orderEvent.unitPrice).toBe(19.99);
        expect(orderEvent.grossAmount).toBe(99.95);
        expect(orderEvent.taxRate).toBe(0.08);
      });
    });

    describe('invalid orders', () => {
      it('should reject order with missing orderId', () => {
        const invalidInput = { ...validPartnerAInput, orderId: '' };
        const result = feedHandler.processPartnerAOrder(invalidInput);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      });

      it('should emit error order to stream for invalid input', () => {
        const invalidInput = { ...validPartnerAInput, quantity: -5 };
        feedHandler.processPartnerAOrder(invalidInput);

        const errorHistory = orderStream.getErrorOrderHistory();
        expect(errorHistory.length).toBe(1);
        expect(errorHistory[0].originalOrderId).toBe('ORD-A-001');
        expect(errorHistory[0].partnerId).toBe(PartnerId.PARTNER_A);
      });

      it('should not increment sequence for invalid orders', () => {
        const invalidInput = { ...validPartnerAInput, quantity: -5 };
        feedHandler.processPartnerAOrder(invalidInput);
        feedHandler.processPartnerAOrder(invalidInput);
        
        const result = feedHandler.processPartnerAOrder(validPartnerAInput);
        expect(result.sequenceNumber).toBe(1);
      });

      it('should include raw input in error payload', () => {
        const invalidInput = { ...validPartnerAInput, quantity: -5 };
        feedHandler.processPartnerAOrder(invalidInput);

        const errorHistory = orderStream.getErrorOrderHistory();
        expect(errorHistory[0].rawInput).toEqual(invalidInput);
      });
    });
  });

  describe('processPartnerBOrder', () => {
    describe('valid orders', () => {
      it('should process valid Partner B order successfully', () => {
        const result = feedHandler.processPartnerBOrder(validPartnerBInput);

        expect(result.success).toBe(true);
        expect(result.orderId).toBe('TXN-B-001');
        expect(result.partnerId).toBe(PartnerId.PARTNER_B);
        expect(result.sequenceNumber).toBe(1);
      });

      it('should emit valid order to stream', () => {
        feedHandler.processPartnerBOrder(validPartnerBInput);

        const history = orderStream.getValidOrderHistory();
        expect(history.length).toBe(1);
        expect(history[0].orderEvent.externalOrderId).toBe('TXN-B-001');
        expect(history[0].orderEvent.partnerId).toBe(PartnerId.PARTNER_B);
      });

      it('should maintain separate sequence from Partner A', () => {
        feedHandler.processPartnerAOrder(validPartnerAInput);
        feedHandler.processPartnerAOrder({ ...validPartnerAInput, orderId: 'ORD-A-002' });
        
        const resultB = feedHandler.processPartnerBOrder(validPartnerBInput);

        expect(resultB.sequenceNumber).toBe(1);
        expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_A)).toBe(2);
        expect(sequenceManager.getCurrentSequence(PartnerId.PARTNER_B)).toBe(1);
      });

      it('should correctly transform Partner B fields', () => {
        feedHandler.processPartnerBOrder(validPartnerBInput);

        const history = orderStream.getValidOrderHistory();
        const orderEvent = history[0].orderEvent;

        expect(orderEvent.productId).toBe('ITEM-456');
        expect(orderEvent.customerId).toBe('CLIENT-001');
        expect(orderEvent.quantity).toBe(3);
        expect(orderEvent.unitPrice).toBe(29.99);
        expect(orderEvent.taxRate).toBe(0.085);
      });
    });

    describe('invalid orders', () => {
      it('should reject order with invalid transaction ID', () => {
        const invalidInput = { ...validPartnerBInput, transactionId: '' };
        const result = feedHandler.processPartnerBOrder(invalidInput);

        expect(result.success).toBe(false);
        expect(result.partnerId).toBe(PartnerId.PARTNER_B);
      });

      it('should emit error order to stream', () => {
        const invalidInput = { ...validPartnerBInput, qty: -1 };
        feedHandler.processPartnerBOrder(invalidInput);

        const errorHistory = orderStream.getErrorOrderHistory();
        expect(errorHistory.length).toBe(1);
        expect(errorHistory[0].partnerId).toBe(PartnerId.PARTNER_B);
      });
    });
  });

  describe('processPartnerABatch', () => {
    it('should process all orders in batch', () => {
      const inputs: PartnerAInput[] = [
        validPartnerAInput,
        { ...validPartnerAInput, orderId: 'ORD-A-002' },
        { ...validPartnerAInput, orderId: 'ORD-A-003' },
      ];

      const results = feedHandler.processPartnerABatch(inputs);

      expect(results.length).toBe(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results.map((r) => r.sequenceNumber)).toEqual([1, 2, 3]);
    });

    it('should handle mixed valid and invalid orders', () => {
      const inputs: PartnerAInput[] = [
        validPartnerAInput,
        { ...validPartnerAInput, orderId: 'ORD-A-002', quantity: -5 },
        { ...validPartnerAInput, orderId: 'ORD-A-003' },
      ];

      const results = feedHandler.processPartnerABatch(inputs);

      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(results[0].sequenceNumber).toBe(1);
      expect(results[2].sequenceNumber).toBe(2);
    });

    it('should emit to correct streams for mixed batch', () => {
      const inputs: PartnerAInput[] = [
        validPartnerAInput,
        { ...validPartnerAInput, orderId: 'ORD-A-002', quantity: -5 },
      ];

      feedHandler.processPartnerABatch(inputs);

      expect(orderStream.getValidOrderHistory().length).toBe(1);
      expect(orderStream.getErrorOrderHistory().length).toBe(1);
    });
  });

  describe('processPartnerBBatch', () => {
    it('should process all orders in batch', () => {
      const inputs: PartnerBInput[] = [
        validPartnerBInput,
        { ...validPartnerBInput, transactionId: 'TXN-B-002' },
      ];

      const results = feedHandler.processPartnerBBatch(inputs);

      expect(results.length).toBe(2);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('stream event notifications', () => {
    it('should notify valid order listeners synchronously', () => {
      let receivedOrder: any = null;

      orderStream.onValidOrder((payload) => {
        receivedOrder = payload.orderEvent;
      });

      feedHandler.processPartnerAOrder(validPartnerAInput);

      expect(receivedOrder).not.toBeNull();
      expect(receivedOrder.externalOrderId).toBe('ORD-A-001');
    });

    it('should notify error order listeners synchronously', () => {
      let receivedError: any = null;

      orderStream.onErrorOrder((payload) => {
        receivedError = payload;
      });

      feedHandler.processPartnerAOrder({ ...validPartnerAInput, quantity: -5 });

      expect(receivedError).not.toBeNull();
      expect(receivedError.originalOrderId).toBe('ORD-A-001');
    });
  });
});
