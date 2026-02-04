import { ErrorEvent, ErrorCode, PartnerId } from '../../domain/models';

/**
 * Error event repository port interface.
 * 
 * SPEC REFERENCE: Optional - "Errors View" in React frontend
 * This port abstracts the storage of error events for invalid orders.
 */
export interface IErrorRepositoryPort {
  /**
   * Save an error event
   */
  save(error: ErrorEvent): Promise<void>;

  /**
   * Find error by ID
   */
  findById(id: string): Promise<ErrorEvent | null>;

  /**
   * Find errors with filters and pagination
   */
  findMany(
    filters?: ErrorQueryFilters,
    pagination?: ErrorPaginationOptions
  ): Promise<ErrorPaginatedResult<ErrorEvent>>;

  /**
   * Get error statistics
   */
  getStatistics(): Promise<ErrorStatistics>;

  /**
   * Count errors
   */
  count(filters?: ErrorQueryFilters): Promise<number>;

  /**
   * Clear all errors (for testing)
   */
  clear(): Promise<void>;
}

/**
 * Query filters for error retrieval
 */
export interface ErrorQueryFilters {
  partnerId?: PartnerId;
  errorCode?: ErrorCode;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Pagination options
 */
export interface ErrorPaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginated result wrapper
 */
export interface ErrorPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Error statistics
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByPartner: Record<string, number>;
  errorsByCode: Record<string, number>;
  last24Hours: number;
}
