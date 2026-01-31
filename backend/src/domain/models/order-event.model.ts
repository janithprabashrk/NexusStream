import { PartnerId } from './partner-input.model';

/**
 * Unified OrderEvent Schema
 * 
 * This is the internal schema after validation and transformation.
 * All partner-specific formats are normalized to this unified structure.
 * 
 * Key calculations:
 * - grossAmount = quantity * unitPrice
 * - taxAmount = grossAmount * taxRate
 * - netAmount = grossAmount + taxAmount
 * 
 * Timestamps are normalized to ISO 8601 format.
 */
export interface OrderEvent {
  /** Unique identifier for this order event (UUID v4) */
  id: string;
  
  /** Original order/transaction ID from the partner */
  externalOrderId: string;
  
  /** Partner that submitted this order */
  partnerId: PartnerId;
  
  /** Sequence number for this partner (starts at 1, increments per order) */
  sequenceNumber: number;
  
  /** Product/SKU identifier (normalized from skuId or itemCode) */
  productId: string;
  
  /** Customer identifier (normalized from customerId or clientId) */
  customerId: string;
  
  /** Number of items ordered */
  quantity: number;
  
  /** Price per unit */
  unitPrice: number;
  
  /** Tax rate as decimal (e.g., 0.1 for 10%) */
  taxRate: number;
  
  /** Gross amount before tax: quantity * unitPrice */
  grossAmount: number;
  
  /** Tax amount: grossAmount * taxRate */
  taxAmount: number;
  
  /** Net amount including tax: grossAmount + taxAmount */
  netAmount: number;
  
  /** Transaction timestamp in ISO 8601 format */
  transactionTime: string;
  
  /** When this order event was processed (ISO 8601) */
  processedAt: string;
  
  /** Additional metadata from the original order */
  metadata?: Record<string, unknown>;
}

/**
 * Order Event creation input (before ID and timestamps are assigned)
 */
export interface CreateOrderEventInput {
  externalOrderId: string;
  partnerId: PartnerId;
  productId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  transactionTime: string;
  metadata?: Record<string, unknown>;
}

/**
 * Order status for tracking
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED'
}
