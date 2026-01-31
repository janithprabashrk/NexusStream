import { InMemoryOrderStream } from '../../../../src/infrastructure/adapters/in-memory-order-stream';
import { ValidOrderPayload, ErrorOrderPayload, PartnerId } from '../../../../src/domain/ports';
import { OrderEvent } from '../../../../src/domain/models';

describe('InMemoryOrderStream', () => {
  let stream: InMemoryOrderStream;

  const createValidPayload = (): ValidOrderPayload => ({
    orderEvent: {
      id: 'uuid-001',
      externalOrderId: 'ORD-001',
      partnerId: PartnerId.PARTNER_A,
      sequenceNumber: 1,
      productId: 'SKU-123',
      customerId: 'CUST-001',
      quantity: 2,
      unitPrice: 10.00,
      grossAmount: 20.00,
      taxRate: 0.08,
      taxAmount: 1.60,
      netAmount: 21.60,
      transactionTime: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    },
    receivedAt: new Date(),
  });

  const createErrorPayload = (): ErrorOrderPayload => ({
    partnerId: PartnerId.PARTNER_A,
    originalOrderId: 'ORD-ERR-001',
    errors: ['Invalid quantity', 'Missing SKU'],
    rawInput: { orderId: 'ORD-ERR-001' },
    timestamp: new Date(),
  });

  beforeEach(() => {
    stream = new InMemoryOrderStream();
  });

  afterEach(() => {
    stream.removeAllListeners();
  });

  describe('emitValidOrder', () => {
    it('should emit valid order event to listeners', (done) => {
      const payload = createValidPayload();

      stream.onValidOrder((received) => {
        expect(received).toEqual(payload);
        done();
      });

      stream.emitValidOrder(payload);
    });

    it('should notify multiple listeners', () => {
      const payload = createValidPayload();
      const results: ValidOrderPayload[] = [];

      stream.onValidOrder((p) => { results.push(p); });
      stream.onValidOrder((p) => { results.push(p); });
      stream.emitValidOrder(payload);

      expect(results.length).toBe(2);
      expect(results[0]).toEqual(payload);
      expect(results[1]).toEqual(payload);
    });

    it('should add to history', () => {
      const payload1 = createValidPayload();
      const payload2 = { ...createValidPayload(), orderEvent: { ...createValidPayload().orderEvent, externalOrderId: 'ORD-002' } };

      stream.emitValidOrder(payload1);
      stream.emitValidOrder(payload2);

      const history = stream.getValidOrderHistory();
      expect(history.length).toBe(2);
      expect(history[0].orderEvent.externalOrderId).toBe('ORD-001');
      expect(history[1].orderEvent.externalOrderId).toBe('ORD-002');
    });
  });

  describe('emitErrorOrder', () => {
    it('should emit error order event to listeners', (done) => {
      const payload = createErrorPayload();

      stream.onErrorOrder((received) => {
        expect(received).toEqual(payload);
        done();
      });

      stream.emitErrorOrder(payload);
    });

    it('should add to error history', () => {
      const payload = createErrorPayload();
      stream.emitErrorOrder(payload);

      const history = stream.getErrorOrderHistory();
      expect(history.length).toBe(1);
      expect(history[0].originalOrderId).toBe('ORD-ERR-001');
    });
  });

  describe('offValidOrder', () => {
    it('should remove specific listener', () => {
      const results: string[] = [];
      const listener1 = () => { results.push('listener1'); };
      const listener2 = () => { results.push('listener2'); };

      stream.onValidOrder(listener1);
      stream.onValidOrder(listener2);
      stream.offValidOrder(listener1);
      stream.emitValidOrder(createValidPayload());

      expect(results).toEqual(['listener2']);
    });
  });

  describe('offErrorOrder', () => {
    it('should remove specific listener', () => {
      const results: string[] = [];
      const listener1 = () => { results.push('listener1'); };
      const listener2 = () => { results.push('listener2'); };

      stream.onErrorOrder(listener1);
      stream.onErrorOrder(listener2);
      stream.offErrorOrder(listener1);
      stream.emitErrorOrder(createErrorPayload());

      expect(results).toEqual(['listener2']);
    });
  });

  describe('listener counts', () => {
    it('should track valid order listener count', () => {
      expect(stream.getValidOrderListenerCount()).toBe(0);

      const listener1 = () => {};
      const listener2 = () => {};

      stream.onValidOrder(listener1);
      expect(stream.getValidOrderListenerCount()).toBe(1);

      stream.onValidOrder(listener2);
      expect(stream.getValidOrderListenerCount()).toBe(2);

      stream.offValidOrder(listener1);
      expect(stream.getValidOrderListenerCount()).toBe(1);
    });

    it('should track error order listener count', () => {
      expect(stream.getErrorOrderListenerCount()).toBe(0);

      stream.onErrorOrder(() => {});
      expect(stream.getErrorOrderListenerCount()).toBe(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear both histories', () => {
      stream.emitValidOrder(createValidPayload());
      stream.emitErrorOrder(createErrorPayload());

      expect(stream.getValidOrderHistory().length).toBe(1);
      expect(stream.getErrorOrderHistory().length).toBe(1);

      stream.clearHistory();

      expect(stream.getValidOrderHistory().length).toBe(0);
      expect(stream.getErrorOrderHistory().length).toBe(0);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners from all events', () => {
      stream.onValidOrder(() => {});
      stream.onValidOrder(() => {});
      stream.onErrorOrder(() => {});

      stream.removeAllListeners();

      expect(stream.getValidOrderListenerCount()).toBe(0);
      expect(stream.getErrorOrderListenerCount()).toBe(0);
    });
  });

  describe('history immutability', () => {
    it('should return copy of valid order history', () => {
      stream.emitValidOrder(createValidPayload());
      const history1 = stream.getValidOrderHistory();
      const history2 = stream.getValidOrderHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    it('should return copy of error order history', () => {
      stream.emitErrorOrder(createErrorPayload());
      const history1 = stream.getErrorOrderHistory();
      const history2 = stream.getErrorOrderHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });
});
