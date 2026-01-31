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
 * Query parameters for order retrieval
 */
export interface OrderQueryParams {
  filters?: OrderQueryFilters;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

/**
 * Result of a single order query
 */
export interface OrderResult {
  found: boolean;
  order?: OrderEvent;
}

/**
 * Order Query Service - Application layer service for retrieving orders.
 * 
 * Responsibilities:
 * - Order lookup by ID
 * - Filtered order listing with pagination
 * - Order statistics aggregation
 * - Idempotency checks
 */
export class OrderQueryService {
  constructor(
    private readonly repository: IOrderRepositoryPort
  ) {}

  /**
   * Get an order by its internal ID
   */
  async getOrderById(id: string): Promise<OrderResult> {
    const order = await this.repository.findById(id);
    return {
      found: order !== null,
      order: order ?? undefined,
    };
  }

  /**
   * Get an order by external order ID and partner
   */
  async getOrderByExternalId(
    externalOrderId: string,
    partnerId: PartnerId
  ): Promise<OrderResult> {
    const order = await this.repository.findByExternalId(externalOrderId, partnerId);
    return {
      found: order !== null,
      order: order ?? undefined,
    };
  }

  /**
   * List orders with optional filters, pagination, and sorting
   */
  async listOrders(params?: OrderQueryParams): Promise<PaginatedResult<OrderEvent>> {
    return this.repository.findMany(
      params?.filters,
      params?.pagination ?? { page: 1, pageSize: 20 },
      params?.sort
    );
  }

  /**
   * Get orders for a specific partner
   */
  async getOrdersByPartner(
    partnerId: PartnerId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<OrderEvent>> {
    return this.repository.findMany(
      { partnerId },
      pagination ?? { page: 1, pageSize: 20 }
    );
  }

  /**
   * Get orders for a specific customer
   */
  async getOrdersByCustomer(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<OrderEvent>> {
    return this.repository.findMany(
      { customerId },
      pagination ?? { page: 1, pageSize: 20 }
    );
  }

  /**
   * Get order statistics
   */
  async getStatistics(filters?: OrderQueryFilters): Promise<OrderStatistics> {
    return this.repository.getStatistics(filters);
  }

  /**
   * Check if an order already exists (for idempotency)
   */
  async orderExists(
    externalOrderId: string,
    partnerId: PartnerId
  ): Promise<boolean> {
    return this.repository.existsByExternalId(externalOrderId, partnerId);
  }

  /**
   * Get total order count
   */
  async getTotalCount(filters?: OrderQueryFilters): Promise<number> {
    return this.repository.count(filters);
  }
}
