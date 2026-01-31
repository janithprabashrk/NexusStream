/**
 * Partner A Input Format
 * 
 * Partner A sends order data with the following field naming conventions:
 * - skuId: Product identifier
 * - transactionTimeMs: Timestamp in milliseconds (Unix epoch)
 * - quantity: Number of items
 * - unitPrice: Price per unit
 * - taxRate: Tax rate as decimal (e.g., 0.1 for 10%)
 * - customerId: Customer identifier
 * - orderId: Unique order identifier from Partner A
 */
export interface PartnerAInput {
  orderId: string;
  skuId: string;
  customerId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  transactionTimeMs: number;
  metadata?: Record<string, unknown>;
}

/**
 * Partner B Input Format
 * 
 * Partner B sends order data with different field naming conventions:
 * - itemCode: Product identifier (maps to skuId)
 * - purchaseTime: ISO 8601 formatted timestamp string
 * - qty: Number of items (maps to quantity)
 * - price: Price per unit (maps to unitPrice)
 * - tax: Tax rate as percentage (e.g., 10 for 10%)
 * - clientId: Customer identifier (maps to customerId)
 * - transactionId: Unique order identifier from Partner B
 */
export interface PartnerBInput {
  transactionId: string;
  itemCode: string;
  clientId: string;
  qty: number;
  price: number;
  tax: number;
  purchaseTime: string;
  notes?: string;
}

/**
 * Partner identifier enum
 */
export enum PartnerId {
  PARTNER_A = 'PARTNER_A',
  PARTNER_B = 'PARTNER_B'
}

/**
 * Union type for all partner inputs
 */
export type PartnerInput = PartnerAInput | PartnerBInput;
