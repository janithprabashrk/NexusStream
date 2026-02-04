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

// Successful feed response from backend
export interface FeedSuccessResponse {
  status: 'accepted';
  orderId: string;
  partnerId: string;
  sequenceNumber: number;
}

// Error feed response from backend
export interface FeedErrorResponse {
  status: 'rejected';
  orderId: string;
  partnerId: string;
  errors: string[];
}

// Combined type for feed API responses
export type FeedResponse = FeedSuccessResponse | FeedErrorResponse;

// Helper type guard
export function isFeedSuccess(response: FeedResponse): response is FeedSuccessResponse {
  return response.status === 'accepted';
}

export interface BatchFeedResponse {
  total: number;
  accepted: number;
  rejected: number;
  results: FeedResponse[];
}

// Error Event for Errors View
export interface ErrorEvent {
  id: string;
  partnerId: string;
  externalOrderId?: string;
  errorCode: string;
  message: string;
  details: Array<{ field: string; message: string }>;
  errors?: string[];
  originalPayload: unknown;
  timestamp: string;
}

// Error Statistics
export interface ErrorStatistics {
  totalErrors: number;
  errorsByPartner: Record<string, number>;
  errorsByCode: Record<string, number>;
  last24Hours: number;
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
