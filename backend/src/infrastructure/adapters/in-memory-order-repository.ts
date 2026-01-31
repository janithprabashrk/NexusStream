import { OrderEvent, PartnerId } from '../../domain/models';
import {
  IOrderRepositoryPort,
  OrderQueryFilters,
  PaginationOptions,
  SortOptions,
  PaginatedResult,
  OrderStatistics,
} from '../../domain/ports';

/**
 * In-memory implementation of order repository.
 * Provides fast lookups using multiple indexes.
 * In production, this would be replaced with a database adapter.
 */
export class InMemoryOrderRepository implements IOrderRepositoryPort {
  // Primary storage: ID -> OrderEvent
  private orders: Map<string, OrderEvent> = new Map();
  
  // Index: externalOrderId:partnerId -> ID (for idempotency checks)
  private externalIdIndex: Map<string, string> = new Map();

  /**
   * Create composite key for external ID index
   */
  private getExternalKey(externalOrderId: string, partnerId: PartnerId): string {
    return `${partnerId}:${externalOrderId}`;
  }

  /**
   * Save an order event
   */
  async save(order: OrderEvent): Promise<void> {
    this.orders.set(order.id, order);
    this.externalIdIndex.set(
      this.getExternalKey(order.externalOrderId, order.partnerId),
      order.id
    );
  }

  /**
   * Save multiple order events
   */
  async saveBatch(orders: OrderEvent[]): Promise<void> {
    for (const order of orders) {
      await this.save(order);
    }
  }

  /**
   * Find order by ID
   */
  async findById(id: string): Promise<OrderEvent | null> {
    return this.orders.get(id) ?? null;
  }

  /**
   * Find order by external order ID and partner
   */
  async findByExternalId(
    externalOrderId: string,
    partnerId: PartnerId
  ): Promise<OrderEvent | null> {
    const id = this.externalIdIndex.get(
      this.getExternalKey(externalOrderId, partnerId)
    );
    if (!id) return null;
    return this.orders.get(id) ?? null;
  }

  /**
   * Check if an order with external ID exists (for idempotency)
   */
  async existsByExternalId(
    externalOrderId: string,
    partnerId: PartnerId
  ): Promise<boolean> {
    return this.externalIdIndex.has(
      this.getExternalKey(externalOrderId, partnerId)
    );
  }

  /**
   * Find orders with filters and pagination
   */
  async findMany(
    filters?: OrderQueryFilters,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<PaginatedResult<OrderEvent>> {
    // Get all orders and apply filters
    let results = Array.from(this.orders.values());
    results = this.applyFilters(results, filters);

    // Apply sorting
    results = this.applySorting(results, sort);

    // Calculate pagination
    const total = results.length;
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = results.slice(startIndex, startIndex + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Apply filters to order list
   */
  private applyFilters(
    orders: OrderEvent[],
    filters?: OrderQueryFilters
  ): OrderEvent[] {
    if (!filters) return orders;

    return orders.filter((order) => {
      // Partner filter
      if (filters.partnerId && order.partnerId !== filters.partnerId) {
        return false;
      }

      // Customer filter
      if (filters.customerId && order.customerId !== filters.customerId) {
        return false;
      }

      // Product filter
      if (filters.productId && order.productId !== filters.productId) {
        return false;
      }

      // Date range filters
      if (filters.fromDate) {
        const orderDate = new Date(order.transactionTime);
        if (orderDate < filters.fromDate) return false;
      }

      if (filters.toDate) {
        const orderDate = new Date(order.transactionTime);
        if (orderDate > filters.toDate) return false;
      }

      // Amount range filters
      if (filters.minAmount !== undefined && order.grossAmount < filters.minAmount) {
        return false;
      }

      if (filters.maxAmount !== undefined && order.grossAmount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting to order list
   */
  private applySorting(
    orders: OrderEvent[],
    sort?: SortOptions
  ): OrderEvent[] {
    if (!sort) {
      // Default: sort by processedAt descending (newest first)
      return orders.sort((a, b) => 
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
      );
    }

    const direction = sort.direction === 'asc' ? 1 : -1;

    return orders.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'processedAt':
          comparison = new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime();
          break;
        case 'transactionTime':
          comparison = new Date(a.transactionTime).getTime() - new Date(b.transactionTime).getTime();
          break;
        case 'grossAmount':
          comparison = a.grossAmount - b.grossAmount;
          break;
        case 'sequenceNumber':
          comparison = a.sequenceNumber - b.sequenceNumber;
          break;
      }

      return comparison * direction;
    });
  }

  /**
   * Get order statistics
   */
  async getStatistics(filters?: OrderQueryFilters): Promise<OrderStatistics> {
    let orders = Array.from(this.orders.values());
    orders = this.applyFilters(orders, filters);

    const ordersByPartner: Record<PartnerId, number> = {
      [PartnerId.PARTNER_A]: 0,
      [PartnerId.PARTNER_B]: 0,
    };

    const highestSequence: Record<PartnerId, number> = {
      [PartnerId.PARTNER_A]: 0,
      [PartnerId.PARTNER_B]: 0,
    };

    let totalGrossAmount = 0;
    let totalTaxAmount = 0;
    let totalNetAmount = 0;

    for (const order of orders) {
      ordersByPartner[order.partnerId]++;
      totalGrossAmount += order.grossAmount;
      totalTaxAmount += order.taxAmount;
      totalNetAmount += order.netAmount;

      if (order.sequenceNumber > highestSequence[order.partnerId]) {
        highestSequence[order.partnerId] = order.sequenceNumber;
      }
    }

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 
      ? Math.round((totalGrossAmount / totalOrders) * 100) / 100 
      : 0;

    return {
      totalOrders,
      ordersByPartner,
      totalGrossAmount: Math.round(totalGrossAmount * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalNetAmount: Math.round(totalNetAmount * 100) / 100,
      averageOrderValue,
      highestSequence,
    };
  }

  /**
   * Count orders matching filters
   */
  async count(filters?: OrderQueryFilters): Promise<number> {
    let orders = Array.from(this.orders.values());
    orders = this.applyFilters(orders, filters);
    return orders.length;
  }

  /**
   * Delete all orders (for testing)
   */
  async clear(): Promise<void> {
    this.orders.clear();
    this.externalIdIndex.clear();
  }

  /**
   * Get all orders (for testing/debugging)
   */
  getAll(): OrderEvent[] {
    return Array.from(this.orders.values());
  }
}
