// Domain Types - matching backend models

export type PartnerId = 'PARTNER_A' | 'PARTNER_B';

export interface OrderEvent {
  id: string;
  externalOrderId: string;
  partnerId: PartnerId;
  sequenceNumber: number;
  productId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  transactionTime: Date;
  processedAt: Date;
}

export interface ErrorEvent {
  id: string;
  partnerId: PartnerId;
  rawPayload: unknown;
  errors: string[];
  receivedAt: Date;
}

export interface PartnerAInput {
  orderId: string;
  skuId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  transactionTimeMs: number;
}

export interface PartnerBInput {
  transactionId: string;
  itemCode: string;
  clientId: string;
  qty: number;
  price: number;
  tax: number;
  purchaseTime: string;
}

// API Response Types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrderStatistics {
  totalOrders: number;
  ordersByPartner: Record<PartnerId, number>;
  totalGrossAmount: number;
  totalTaxAmount: number;
  totalNetAmount: number;
  averageOrderValue: number;
  ordersByDate: Record<string, number>;
}

export interface FeedResponse {
  success: boolean;
  order?: OrderEvent;
  errors?: string[];
}

export interface BatchFeedResponse {
  success: boolean;
  results: Array<{
    success: boolean;
    order?: OrderEvent;
    errors?: string[];
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Query Parameters
export interface OrderQueryFilters {
  partnerId?: PartnerId;
  customerId?: string;
  productId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export type SortField = 'transactionTime' | 'processedAt' | 'netAmount' | 'sequenceNumber';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field?: SortField;
  direction?: SortDirection;
}

export interface QueryParams extends OrderQueryFilters, PaginationOptions, SortOptions {}
