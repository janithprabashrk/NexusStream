import request from 'supertest';
import { Express } from 'express';
import { createApp, createContainer, AppContainer } from '../../../../src/app';
import { PartnerAInput, PartnerBInput, PartnerId, OrderEvent } from '../../../../src/domain/models';

describe('Orders Router', () => {
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

  beforeEach(async () => {
    container = createContainer();
    app = createApp(container);
  });

  afterEach(async () => {
    container.orderStream.removeAllListeners();
    container.orderStream.clearHistory();
    container.sequenceManager.resetAll();
    await container.orderRepository.clear();
  });

  describe('GET /api/orders', () => {
    it('should return empty list when no orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.total).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    it('should return orders after feed processing', async () => {
      // Submit an order
      await request(app)
        .post('/api/feed/partner-a')
        .send(validPartnerAInput)
        .expect(202);

      // Query orders
      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.data[0].externalOrderId).toBe('ORD-A-001');
    });

    it('should filter by partnerId', async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
      await request(app).post('/api/feed/partner-b').send(validPartnerBInput);

      const response = await request(app)
        .get('/api/orders?partnerId=PARTNER_A')
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.data[0].partnerId).toBe(PartnerId.PARTNER_A);
    });

    it('should filter by customerId', async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
      await request(app).post('/api/feed/partner-b').send(validPartnerBInput);

      const response = await request(app)
        .get('/api/orders?customerId=CUST-001')
        .expect(200);

      expect(response.body.total).toBe(1);
    });

    it('should paginate results', async () => {
      // Create 5 orders
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/feed/partner-a')
          .send({ ...validPartnerAInput, orderId: `ORD-A-00${i}` });
      }

      const response = await request(app)
        .get('/api/orders?page=1&pageSize=2')
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(5);
      expect(response.body.totalPages).toBe(3);
      expect(response.body.hasMore).toBe(true);
    });

    it('should sort by grossAmount', async () => {
      await request(app)
        .post('/api/feed/partner-a')
        .send({ ...validPartnerAInput, orderId: 'ORD-1', quantity: 1 });
      await request(app)
        .post('/api/feed/partner-a')
        .send({ ...validPartnerAInput, orderId: 'ORD-2', quantity: 10 });
      await request(app)
        .post('/api/feed/partner-a')
        .send({ ...validPartnerAInput, orderId: 'ORD-3', quantity: 5 });

      const response = await request(app)
        .get('/api/orders?sortBy=grossAmount&sortOrder=asc')
        .expect(200);

      const amounts = response.body.data.map((o: OrderEvent) => o.grossAmount);
      expect(amounts[0]).toBeLessThan(amounts[1]);
      expect(amounts[1]).toBeLessThan(amounts[2]);
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should return empty stats when no orders', async () => {
      const response = await request(app)
        .get('/api/orders/stats')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.statistics.totalOrders).toBe(0);
    });

    it('should return aggregated statistics', async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
      await request(app).post('/api/feed/partner-b').send(validPartnerBInput);

      const response = await request(app)
        .get('/api/orders/stats')
        .expect(200);

      expect(response.body.statistics.totalOrders).toBe(2);
      expect(response.body.statistics.ordersByPartner[PartnerId.PARTNER_A]).toBe(1);
      expect(response.body.statistics.ordersByPartner[PartnerId.PARTNER_B]).toBe(1);
      expect(response.body.statistics.totalGrossAmount).toBeGreaterThan(0);
    });

    it('should filter statistics by partner', async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
      await request(app).post('/api/feed/partner-b').send(validPartnerBInput);

      const response = await request(app)
        .get('/api/orders/stats?partnerId=PARTNER_A')
        .expect(200);

      expect(response.body.statistics.totalOrders).toBe(1);
    });
  });

  describe('GET /api/orders/by-partner/:partnerId', () => {
    beforeEach(async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
      await request(app).post('/api/feed/partner-b').send(validPartnerBInput);
    });

    it('should return orders for partner A', async () => {
      const response = await request(app)
        .get('/api/orders/by-partner/A')
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.partnerId).toBe(PartnerId.PARTNER_A);
    });

    it('should return orders for partner B', async () => {
      const response = await request(app)
        .get('/api/orders/by-partner/PARTNER_B')
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.partnerId).toBe(PartnerId.PARTNER_B);
    });

    it('should return 400 for invalid partner', async () => {
      const response = await request(app)
        .get('/api/orders/by-partner/INVALID')
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/orders/by-customer/:customerId', () => {
    beforeEach(async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
      await request(app).post('/api/feed/partner-b').send(validPartnerBInput);
    });

    it('should return orders for specific customer', async () => {
      const response = await request(app)
        .get('/api/orders/by-customer/CUST-001')
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.customerId).toBe('CUST-001');
    });

    it('should return empty for non-existent customer', async () => {
      const response = await request(app)
        .get('/api/orders/by-customer/NON-EXISTENT')
        .expect(200);

      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by ID', async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);

      // Get the order ID from the repository using findMany
      const result = await container.orderRepository.findMany();
      const orderId = result.data[0].id;

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.order.id).toBe(orderId);
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/api/orders/non-existent-id')
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/orders/external/:partnerId/:externalId', () => {
    beforeEach(async () => {
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
    });

    it('should find order by external ID', async () => {
      const response = await request(app)
        .get('/api/orders/external/A/ORD-A-001')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.order.externalOrderId).toBe('ORD-A-001');
    });

    it('should return 404 for wrong partner', async () => {
      const response = await request(app)
        .get('/api/orders/external/B/ORD-A-001')
        .expect(404);

      expect(response.body.status).toBe('error');
    });

    it('should return 400 for invalid partner', async () => {
      const response = await request(app)
        .get('/api/orders/external/INVALID/ORD-A-001')
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Integration: Feed to Query flow', () => {
    it('should persist and query multiple orders correctly', async () => {
      // Submit multiple orders
      await request(app).post('/api/feed/partner-a').send(validPartnerAInput);
      await request(app).post('/api/feed/partner-a').send({ ...validPartnerAInput, orderId: 'ORD-A-002' });
      await request(app).post('/api/feed/partner-b').send(validPartnerBInput);

      // Verify total count
      const allOrders = await request(app).get('/api/orders').expect(200);
      expect(allOrders.body.total).toBe(3);

      // Verify stats
      const stats = await request(app).get('/api/orders/stats').expect(200);
      expect(stats.body.statistics.totalOrders).toBe(3);
      expect(stats.body.statistics.ordersByPartner[PartnerId.PARTNER_A]).toBe(2);
      expect(stats.body.statistics.ordersByPartner[PartnerId.PARTNER_B]).toBe(1);
      expect(stats.body.statistics.highestSequence[PartnerId.PARTNER_A]).toBe(2);
      expect(stats.body.statistics.highestSequence[PartnerId.PARTNER_B]).toBe(1);
    });
  });
});
