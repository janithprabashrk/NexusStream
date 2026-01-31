import { InMemoryOrderRepository } from '../../../../src/infrastructure/adapters/in-memory-order-repository';
import { OrderEvent, PartnerId } from '../../../../src/domain/models';

describe('InMemoryOrderRepository', () => {
  let repository: InMemoryOrderRepository;

  const createOrder = (overrides: Partial<OrderEvent> = {}): OrderEvent => ({
    id: `uuid-${Math.random().toString(36).slice(2)}`,
    externalOrderId: 'EXT-001',
    partnerId: PartnerId.PARTNER_A,
    sequenceNumber: 1,
    productId: 'PROD-001',
    customerId: 'CUST-001',
    quantity: 2,
    unitPrice: 10.00,
    grossAmount: 20.00,
    taxRate: 0.08,
    taxAmount: 1.60,
    netAmount: 21.60,
    transactionTime: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(async () => {
    repository = new InMemoryOrderRepository();
  });

  describe('save and findById', () => {
    it('should save and retrieve an order by ID', async () => {
      const order = createOrder({ id: 'test-id-1' });
      await repository.save(order);
      
      const found = await repository.findById('test-id-1');
      expect(found).toEqual(order);
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByExternalId', () => {
    it('should find order by external ID and partner', async () => {
      const order = createOrder({ 
        externalOrderId: 'EXT-123',
        partnerId: PartnerId.PARTNER_A 
      });
      await repository.save(order);
      
      const found = await repository.findByExternalId('EXT-123', PartnerId.PARTNER_A);
      expect(found).toEqual(order);
    });

    it('should return null if partner does not match', async () => {
      const order = createOrder({ 
        externalOrderId: 'EXT-123',
        partnerId: PartnerId.PARTNER_A 
      });
      await repository.save(order);
      
      const found = await repository.findByExternalId('EXT-123', PartnerId.PARTNER_B);
      expect(found).toBeNull();
    });
  });

  describe('existsByExternalId', () => {
    it('should return true if order exists', async () => {
      const order = createOrder({ 
        externalOrderId: 'EXT-123',
        partnerId: PartnerId.PARTNER_A 
      });
      await repository.save(order);
      
      const exists = await repository.existsByExternalId('EXT-123', PartnerId.PARTNER_A);
      expect(exists).toBe(true);
    });

    it('should return false if order does not exist', async () => {
      const exists = await repository.existsByExternalId('EXT-NONE', PartnerId.PARTNER_A);
      expect(exists).toBe(false);
    });
  });

  describe('saveBatch', () => {
    it('should save multiple orders', async () => {
      const orders = [
        createOrder({ id: 'batch-1', externalOrderId: 'EXT-1' }),
        createOrder({ id: 'batch-2', externalOrderId: 'EXT-2' }),
        createOrder({ id: 'batch-3', externalOrderId: 'EXT-3' }),
      ];
      
      await repository.saveBatch(orders);
      
      expect(await repository.findById('batch-1')).toBeTruthy();
      expect(await repository.findById('batch-2')).toBeTruthy();
      expect(await repository.findById('batch-3')).toBeTruthy();
    });
  });

  describe('findMany with filters', () => {
    beforeEach(async () => {
      await repository.saveBatch([
        createOrder({ 
          id: 'order-1', 
          partnerId: PartnerId.PARTNER_A,
          customerId: 'CUST-A',
          productId: 'PROD-1',
          grossAmount: 100,
          transactionTime: '2025-01-15T10:00:00Z'
        }),
        createOrder({ 
          id: 'order-2', 
          partnerId: PartnerId.PARTNER_B,
          customerId: 'CUST-B',
          productId: 'PROD-1',
          grossAmount: 200,
          transactionTime: '2025-01-20T10:00:00Z'
        }),
        createOrder({ 
          id: 'order-3', 
          partnerId: PartnerId.PARTNER_A,
          customerId: 'CUST-A',
          productId: 'PROD-2',
          grossAmount: 300,
          transactionTime: '2025-01-25T10:00:00Z'
        }),
      ]);
    });

    it('should return all orders without filters', async () => {
      const result = await repository.findMany();
      expect(result.total).toBe(3);
      expect(result.data.length).toBe(3);
    });

    it('should filter by partnerId', async () => {
      const result = await repository.findMany({ partnerId: PartnerId.PARTNER_A });
      expect(result.total).toBe(2);
      expect(result.data.every(o => o.partnerId === PartnerId.PARTNER_A)).toBe(true);
    });

    it('should filter by customerId', async () => {
      const result = await repository.findMany({ customerId: 'CUST-A' });
      expect(result.total).toBe(2);
      expect(result.data.every(o => o.customerId === 'CUST-A')).toBe(true);
    });

    it('should filter by productId', async () => {
      const result = await repository.findMany({ productId: 'PROD-1' });
      expect(result.total).toBe(2);
    });

    it('should filter by date range', async () => {
      const result = await repository.findMany({
        fromDate: new Date('2025-01-18'),
        toDate: new Date('2025-01-22'),
      });
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe('order-2');
    });

    it('should filter by amount range', async () => {
      const result = await repository.findMany({
        minAmount: 150,
        maxAmount: 250,
      });
      expect(result.total).toBe(1);
      expect(result.data[0].grossAmount).toBe(200);
    });

    it('should combine multiple filters', async () => {
      const result = await repository.findMany({
        partnerId: PartnerId.PARTNER_A,
        customerId: 'CUST-A',
      });
      expect(result.total).toBe(2);
    });
  });

  describe('findMany with pagination', () => {
    beforeEach(async () => {
      const orders = Array.from({ length: 25 }, (_, i) => 
        createOrder({ 
          id: `order-${i + 1}`,
          externalOrderId: `EXT-${i + 1}`,
          sequenceNumber: i + 1,
        })
      );
      await repository.saveBatch(orders);
    });

    it('should paginate results', async () => {
      const page1 = await repository.findMany(undefined, { page: 1, pageSize: 10 });
      expect(page1.data.length).toBe(10);
      expect(page1.total).toBe(25);
      expect(page1.totalPages).toBe(3);
      expect(page1.hasMore).toBe(true);
      
      const page2 = await repository.findMany(undefined, { page: 2, pageSize: 10 });
      expect(page2.data.length).toBe(10);
      expect(page2.hasMore).toBe(true);
      
      const page3 = await repository.findMany(undefined, { page: 3, pageSize: 10 });
      expect(page3.data.length).toBe(5);
      expect(page3.hasMore).toBe(false);
    });

    it('should use default pagination', async () => {
      const result = await repository.findMany();
      expect(result.pageSize).toBe(20);
      expect(result.page).toBe(1);
    });
  });

  describe('findMany with sorting', () => {
    beforeEach(async () => {
      await repository.saveBatch([
        createOrder({ 
          id: 'order-1', 
          grossAmount: 100,
          sequenceNumber: 1,
          processedAt: '2025-01-15T10:00:00Z'
        }),
        createOrder({ 
          id: 'order-2', 
          grossAmount: 300,
          sequenceNumber: 2,
          processedAt: '2025-01-20T10:00:00Z'
        }),
        createOrder({ 
          id: 'order-3', 
          grossAmount: 200,
          sequenceNumber: 3,
          processedAt: '2025-01-10T10:00:00Z'
        }),
      ]);
    });

    it('should sort by grossAmount ascending', async () => {
      const result = await repository.findMany(
        undefined,
        undefined,
        { field: 'grossAmount', direction: 'asc' }
      );
      expect(result.data.map(o => o.grossAmount)).toEqual([100, 200, 300]);
    });

    it('should sort by grossAmount descending', async () => {
      const result = await repository.findMany(
        undefined,
        undefined,
        { field: 'grossAmount', direction: 'desc' }
      );
      expect(result.data.map(o => o.grossAmount)).toEqual([300, 200, 100]);
    });

    it('should sort by sequenceNumber', async () => {
      const result = await repository.findMany(
        undefined,
        undefined,
        { field: 'sequenceNumber', direction: 'asc' }
      );
      expect(result.data.map(o => o.sequenceNumber)).toEqual([1, 2, 3]);
    });

    it('should default to processedAt descending', async () => {
      const result = await repository.findMany();
      // Newest first: order-2, order-1, order-3
      expect(result.data[0].id).toBe('order-2');
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await repository.saveBatch([
        createOrder({ 
          partnerId: PartnerId.PARTNER_A,
          sequenceNumber: 1,
          grossAmount: 100,
          taxAmount: 8,
          netAmount: 108,
        }),
        createOrder({ 
          partnerId: PartnerId.PARTNER_A,
          sequenceNumber: 2,
          grossAmount: 200,
          taxAmount: 16,
          netAmount: 216,
        }),
        createOrder({ 
          partnerId: PartnerId.PARTNER_B,
          sequenceNumber: 1,
          grossAmount: 300,
          taxAmount: 24,
          netAmount: 324,
        }),
      ]);
    });

    it('should calculate correct statistics', async () => {
      const stats = await repository.getStatistics();
      
      expect(stats.totalOrders).toBe(3);
      expect(stats.ordersByPartner[PartnerId.PARTNER_A]).toBe(2);
      expect(stats.ordersByPartner[PartnerId.PARTNER_B]).toBe(1);
      expect(stats.totalGrossAmount).toBe(600);
      expect(stats.totalTaxAmount).toBe(48);
      expect(stats.totalNetAmount).toBe(648);
      expect(stats.averageOrderValue).toBe(200);
      expect(stats.highestSequence[PartnerId.PARTNER_A]).toBe(2);
      expect(stats.highestSequence[PartnerId.PARTNER_B]).toBe(1);
    });

    it('should apply filters to statistics', async () => {
      const stats = await repository.getStatistics({ partnerId: PartnerId.PARTNER_A });
      
      expect(stats.totalOrders).toBe(2);
      expect(stats.totalGrossAmount).toBe(300);
    });

    it('should handle empty repository', async () => {
      await repository.clear();
      const stats = await repository.getStatistics();
      
      expect(stats.totalOrders).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });
  });

  describe('count', () => {
    it('should count all orders', async () => {
      await repository.saveBatch([
        createOrder({ id: '1' }),
        createOrder({ id: '2' }),
        createOrder({ id: '3' }),
      ]);
      
      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should count with filters', async () => {
      await repository.saveBatch([
        createOrder({ id: '1', partnerId: PartnerId.PARTNER_A }),
        createOrder({ id: '2', partnerId: PartnerId.PARTNER_B }),
        createOrder({ id: '3', partnerId: PartnerId.PARTNER_A }),
      ]);
      
      const count = await repository.count({ partnerId: PartnerId.PARTNER_A });
      expect(count).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all orders', async () => {
      await repository.saveBatch([
        createOrder({ id: '1' }),
        createOrder({ id: '2' }),
      ]);
      
      await repository.clear();
      
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});
