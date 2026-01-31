import { OrderEvent, PartnerId } from '../models';

/**
 * Query filters for order retrieval
 */
export interface OrderQueryFilters {
  /** Filter by partner ID */
  partnerId?: PartnerId;
  
  /** Filter by customer ID */
  customerId?: string;
  
  /** Filter by product ID */
  productId?: string;
  
  /** Filter orders after this date (inclusive) */
  fromDate?: Date;
  
  /** Filter orders before this date (inclusive) */
  toDate?: Date;
  
  /** Minimum gross amount */
  minAmount?: number;
  
  /** Maximum gross amount */
  maxAmount?: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Page number (1-based) */
  page: number;
  
  /** Number of items per page */
  pageSize: number;
}

/**
 * Sort options
 */
export interface SortOptions {
  /** Field to sort by */
  field: 'processedAt' | 'transactionTime' | 'grossAmount' | 'sequenceNumber';
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Items on current page */
  data: T[];
  
  /** Total number of items matching filters */
  total: number;
  
  /** Current page number */
  page: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Has more pages */
  hasMore: boolean;
}

/**
 * Order statistics
 */
export interface OrderStatistics {
  /** Total number of orders */
  totalOrders: number;
  
  /** Orders per partner */
  ordersByPartner: Record<PartnerId, number>;
  
  /** Total gross amount */
  totalGrossAmount: number;
  
  /** Total tax amount */
  totalTaxAmount: number;
  
  /** Total net amount */
  totalNetAmount: number;
  
  /** Average order value */
  averageOrderValue: number;
  
  /** Highest sequence per partner */
  highestSequence: Record<PartnerId, number>;
}

/**
 * Port interface for order persistence.
 * Abstracts the storage mechanism (in-memory, database, etc.)
 */
export interface IOrderRepositoryPort {
  /**
   * Save an order event
   */
  save(order: OrderEvent): Promise<void>;
  
  /**
   * Save multiple order events
   */
  saveBatch(orders: OrderEvent[]): Promise<void>;
  
  /**
   * Find order by ID
   */
  findById(id: string): Promise<OrderEvent | null>;
  
  /**
   * Find order by external order ID and partner
   */
  findByExternalId(externalOrderId: string, partnerId: PartnerId): Promise<OrderEvent | null>;
  
  /**
   * Find orders with filters and pagination
   */
  findMany(
    filters?: OrderQueryFilters,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<PaginatedResult<OrderEvent>>;
  
  /**
   * Get order statistics
   */
  getStatistics(filters?: OrderQueryFilters): Promise<OrderStatistics>;
  
  /**
   * Check if an order with external ID exists (for idempotency)
   */
  existsByExternalId(externalOrderId: string, partnerId: PartnerId): Promise<boolean>;
  
  /**
   * Count orders matching filters
   */
  count(filters?: OrderQueryFilters): Promise<number>;
  
  /**
   * Delete all orders (for testing)
   */
  clear(): Promise<void>;
}
