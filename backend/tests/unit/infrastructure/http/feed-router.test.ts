import request from 'supertest';
import { Express } from 'express';
import { createApp, createContainer, AppContainer } from '../../../../src/app';
import { PartnerAInput, PartnerBInput, PartnerId } from '../../../../src/domain/models';

describe('Feed Router', () => {
  let app: Express;
  let container: AppContainer;

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
    container = createContainer();
    app = createApp(container);
  });

  afterEach(() => {
    container.orderStream.removeAllListeners();
    container.orderStream.clearHistory();
    container.sequenceManager.resetAll();
  });

  describe('POST /api/feed/partner-a', () => {
    it('should accept valid Partner A order with 202 status', async () => {
      const response = await request(app)
        .post('/api/feed/partner-a')
        .send(validPartnerAInput)
        .expect('Content-Type', /json/)
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
        orderId: 'ORD-A-001',
        partnerId: PartnerId.PARTNER_A,
        sequenceNumber: 1,
      });
    });

    it('should reject invalid Partner A order with 422 status', async () => {
      const invalidInput = { ...validPartnerAInput, quantity: -5 };

      const response = await request(app)
        .post('/api/feed/partner-a')
        .send(invalidInput)
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body.status).toBe('rejected');
      expect(response.body.orderId).toBe('ORD-A-001');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await request(app)
        .post('/api/feed/partner-a')
        .set('Content-Type', 'application/json')
        .send('not valid json')
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('should increment sequence numbers across requests', async () => {
      const response1 = await request(app)
        .post('/api/feed/partner-a')
        .send(validPartnerAInput)
        .expect(202);

      const response2 = await request(app)
        .post('/api/feed/partner-a')
        .send({ ...validPartnerAInput, orderId: 'ORD-A-002' })
        .expect(202);

      expect(response1.body.sequenceNumber).toBe(1);
      expect(response2.body.sequenceNumber).toBe(2);
    });

    it('should emit valid orders to stream', async () => {
      await request(app)
        .post('/api/feed/partner-a')
        .send(validPartnerAInput)
        .expect(202);

      const history = container.orderStream.getValidOrderHistory();
      expect(history.length).toBe(1);
      expect(history[0].orderEvent.orderId).toBe('ORD-A-001');
    });
  });

  describe('POST /api/feed/partner-b', () => {
    it('should accept valid Partner B order with 202 status', async () => {
      const response = await request(app)
        .post('/api/feed/partner-b')
        .send(validPartnerBInput)
        .expect('Content-Type', /json/)
        .expect(202);

      expect(response.body).toEqual({
        status: 'accepted',
        orderId: 'TXN-B-001',
        partnerId: PartnerId.PARTNER_B,
        sequenceNumber: 1,
      });
    });

    it('should reject invalid Partner B order with 422 status', async () => {
      const invalidInput = { ...validPartnerBInput, qty: -1 };

      const response = await request(app)
        .post('/api/feed/partner-b')
        .send(invalidInput)
        .expect('Content-Type', /json/)
        .expect(422);

      expect(response.body.status).toBe('rejected');
      expect(response.body.partnerId).toBe(PartnerId.PARTNER_B);
    });

    it('should maintain separate sequence from Partner A', async () => {
      await request(app)
        .post('/api/feed/partner-a')
        .send(validPartnerAInput)
        .expect(202);

      await request(app)
        .post('/api/feed/partner-a')
        .send({ ...validPartnerAInput, orderId: 'ORD-A-002' })
        .expect(202);

      const response = await request(app)
        .post('/api/feed/partner-b')
        .send(validPartnerBInput)
        .expect(202);

      expect(response.body.sequenceNumber).toBe(1);
    });
  });

  describe('POST /api/feed/partner-a/batch', () => {
    it('should process batch of Partner A orders', async () => {
      const inputs: PartnerAInput[] = [
        validPartnerAInput,
        { ...validPartnerAInput, orderId: 'ORD-A-002' },
        { ...validPartnerAInput, orderId: 'ORD-A-003' },
      ];

      const response = await request(app)
        .post('/api/feed/partner-a/batch')
        .send(inputs)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.total).toBe(3);
      expect(response.body.accepted).toBe(3);
      expect(response.body.rejected).toBe(0);
      expect(response.body.results.length).toBe(3);
    });

    it('should handle mixed valid and invalid orders', async () => {
      const inputs: PartnerAInput[] = [
        validPartnerAInput,
        { ...validPartnerAInput, orderId: 'ORD-A-002', quantity: -5 },
        { ...validPartnerAInput, orderId: 'ORD-A-003' },
      ];

      const response = await request(app)
        .post('/api/feed/partner-a/batch')
        .send(inputs)
        .expect(200);

      expect(response.body.total).toBe(3);
      expect(response.body.accepted).toBe(2);
      expect(response.body.rejected).toBe(1);
    });

    it('should return 400 if body is not an array', async () => {
      const response = await request(app)
        .post('/api/feed/partner-a/batch')
        .send(validPartnerAInput)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('array');
    });
  });

  describe('POST /api/feed/partner-b/batch', () => {
    it('should process batch of Partner B orders', async () => {
      const inputs: PartnerBInput[] = [
        validPartnerBInput,
        { ...validPartnerBInput, transactionId: 'TXN-B-002' },
      ];

      const response = await request(app)
        .post('/api/feed/partner-b/batch')
        .send(inputs)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.accepted).toBe(2);
    });

    it('should return 400 if body is not an array', async () => {
      const response = await request(app)
        .post('/api/feed/partner-b/batch')
        .send(validPartnerBInput)
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });
});
