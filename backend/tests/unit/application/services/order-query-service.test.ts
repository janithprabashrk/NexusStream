import { OrderQueryService } from '../../../../src/application/services/order-query-service';
import { InMemoryOrderRepository } from '../../../../src/infrastructure/adapters/in-memory-order-repository';
import { OrderEvent, PartnerId } from '../../../../src/domain/models';

describe('OrderQueryService', () => {
  let queryService: OrderQueryService;
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
    queryService = new OrderQueryService(repository);
  });

  describe('getOrderById', () => {
    it('should return found=true with order when exists', async () => {
      const order = createOrder({ id: 'test-id' });
      await repository.save(order);
      
      const result = await queryService.getOrderById('test-id');
      
      expect(result.found).toBe(true);
      expect(result.order).toEqual(order);
    });

    it('should return found=false when not exists', async () => {
      const result = await queryService.getOrderById('non-existent');
      
      expect(result.found).toBe(false);
      expect(result.order).toBeUndefined();
    });
  });

  describe('getOrderByExternalId', () => {
    it('should find order by external ID and partner', async () => {
      const order = createOrder({ 
        externalOrderId: 'EXT-123',
        partnerId: PartnerId.PARTNER_A 
      });
      await repository.save(order);
      
      const result = await queryService.getOrderByExternalId('EXT-123', PartnerId.PARTNER_A);
      
      expect(result.found).toBe(true);
      expect(result.order?.externalOrderId).toBe('EXT-123');
    });

    it('should not find order with wrong partner', async () => {
      const order = createOrder({ 
        externalOrderId: 'EXT-123',
        partnerId: PartnerId.PARTNER_A 
      });
      await repository.save(order);
      
      const result = await queryService.getOrderByExternalId('EXT-123', PartnerId.PARTNER_B);
      
      expect(result.found).toBe(false);
    });
  });

  describe('listOrders', () => {
    beforeEach(async () => {
      await repository.saveBatch([
        createOrder({ id: 'order-1', customerId: 'CUST-A' }),
        createOrder({ id: 'order-2', customerId: 'CUST-B' }),
        createOrder({ id: 'order-3', customerId: 'CUST-A' }),
      ]);
    });

    it('should list all orders with default pagination', async () => {
      const result = await queryService.listOrders();
      
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should apply filters', async () => {
      const result = await queryService.listOrders({
        filters: { customerId: 'CUST-A' },
      });
      
      expect(result.total).toBe(2);
    });

    it('should apply pagination', async () => {
      const result = await queryService.listOrders({
        pagination: { page: 1, pageSize: 2 },
      });
      
      expect(result.data.length).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should apply sorting', async () => {
      await repository.clear();
      await repository.saveBatch([
        createOrder({ id: 'a', grossAmount: 300 }),
        createOrder({ id: 'b', grossAmount: 100 }),
        createOrder({ id: 'c', grossAmount: 200 }),
      ]);
      
      const result = await queryService.listOrders({
        sort: { field: 'grossAmount', direction: 'asc' },
      });
      
      expect(result.data.map(o => o.grossAmount)).toEqual([100, 200, 300]);
    });
  });

  describe('getOrdersByPartner', () => {
    beforeEach(async () => {
      await repository.saveBatch([
        createOrder({ id: '1', partnerId: PartnerId.PARTNER_A }),
        createOrder({ id: '2', partnerId: PartnerId.PARTNER_B }),
        createOrder({ id: '3', partnerId: PartnerId.PARTNER_A }),
      ]);
    });

    it('should return orders for specific partner', async () => {
      const result = await queryService.getOrdersByPartner(PartnerId.PARTNER_A);
      
      expect(result.total).toBe(2);
      expect(result.data.every(o => o.partnerId === PartnerId.PARTNER_A)).toBe(true);
    });
  });

  describe('getOrdersByCustomer', () => {
    beforeEach(async () => {
      await repository.saveBatch([
        createOrder({ id: '1', customerId: 'CUST-X' }),
        createOrder({ id: '2', customerId: 'CUST-Y' }),
        createOrder({ id: '3', customerId: 'CUST-X' }),
      ]);
    });

    it('should return orders for specific customer', async () => {
      const result = await queryService.getOrdersByCustomer('CUST-X');
      
      expect(result.total).toBe(2);
      expect(result.data.every(o => o.customerId === 'CUST-X')).toBe(true);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await repository.saveBatch([
        createOrder({ 
          partnerId: PartnerId.PARTNER_A,
          grossAmount: 100,
          taxAmount: 8,
          netAmount: 108,
          sequenceNumber: 1,
        }),
        createOrder({ 
          partnerId: PartnerId.PARTNER_B,
          grossAmount: 200,
          taxAmount: 16,
          netAmount: 216,
          sequenceNumber: 1,
        }),
      ]);
    });

    it('should return aggregated statistics', async () => {
      const stats = await queryService.getStatistics();
      
      expect(stats.totalOrders).toBe(2);
      expect(stats.totalGrossAmount).toBe(300);
      expect(stats.averageOrderValue).toBe(150);
    });

    it('should filter statistics', async () => {
      const stats = await queryService.getStatistics({ partnerId: PartnerId.PARTNER_A });
      
      expect(stats.totalOrders).toBe(1);
      expect(stats.totalGrossAmount).toBe(100);
    });
  });

  describe('orderExists', () => {
    it('should return true when order exists', async () => {
      const order = createOrder({ 
        externalOrderId: 'EXT-TEST',
        partnerId: PartnerId.PARTNER_A 
      });
      await repository.save(order);
      
      const exists = await queryService.orderExists('EXT-TEST', PartnerId.PARTNER_A);
      expect(exists).toBe(true);
    });

    it('should return false when order does not exist', async () => {
      const exists = await queryService.orderExists('NON-EXISTENT', PartnerId.PARTNER_A);
      expect(exists).toBe(false);
    });
  });

  describe('getTotalCount', () => {
    it('should return total count', async () => {
      await repository.saveBatch([
        createOrder({ id: '1' }),
        createOrder({ id: '2' }),
        createOrder({ id: '3' }),
      ]);
      
      const count = await queryService.getTotalCount();
      expect(count).toBe(3);
    });

    it('should return filtered count', async () => {
      await repository.saveBatch([
        createOrder({ id: '1', partnerId: PartnerId.PARTNER_A }),
        createOrder({ id: '2', partnerId: PartnerId.PARTNER_B }),
      ]);
      
      const count = await queryService.getTotalCount({ partnerId: PartnerId.PARTNER_A });
      expect(count).toBe(1);
    });
  });
});
