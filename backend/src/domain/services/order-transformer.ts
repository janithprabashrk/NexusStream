import { v4 as uuidv4 } from 'uuid';
import { 
  PartnerAInput, 
  PartnerBInput, 
  PartnerId, 
  OrderEvent,
  CreateOrderEventInput 
} from '../models';

/**
 * Transformer for converting partner-specific input formats
 * to the unified OrderEvent schema.
 * 
 * Responsibilities:
 * - Normalize field names across partners
 * - Convert timestamps to ISO 8601
 * - Calculate grossAmount, taxAmount, and netAmount
 * - Generate unique IDs
 * - Handle partner-specific data formats
 */
export class OrderTransformer {
  /**
   * Transform Partner A input to OrderEvent creation input
   * 
   * Partner A specifics:
   * - transactionTimeMs: timestamp in milliseconds -> ISO 8601
   * - taxRate: already in decimal format (0.1 = 10%)
   */
  transformPartnerA(input: PartnerAInput): CreateOrderEventInput {
    return {
      externalOrderId: input.orderId,
      partnerId: PartnerId.PARTNER_A,
      productId: input.skuId,
      customerId: input.customerId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      taxRate: input.taxRate,
      transactionTime: this.convertMsToISO8601(input.transactionTimeMs),
      metadata: input.metadata
    };
  }

  /**
   * Transform Partner B input to OrderEvent creation input
   * 
   * Partner B specifics:
   * - purchaseTime: already in ISO 8601 format
   * - tax: percentage format (10 = 10%) -> decimal (0.1)
   * - Field name mappings:
   *   - transactionId -> externalOrderId
   *   - itemCode -> productId
   *   - clientId -> customerId
   *   - qty -> quantity
   *   - price -> unitPrice
   */
  transformPartnerB(input: PartnerBInput): CreateOrderEventInput {
    return {
      externalOrderId: input.transactionId,
      partnerId: PartnerId.PARTNER_B,
      productId: input.itemCode,
      customerId: input.clientId,
      quantity: input.qty,
      unitPrice: input.price,
      taxRate: this.convertPercentageToDecimal(input.tax),
      transactionTime: this.normalizeISO8601(input.purchaseTime),
      metadata: input.notes ? { notes: input.notes } : undefined
    };
  }

  /**
   * Build a complete OrderEvent from creation input
   * 
   * Calculations:
   * - grossAmount = quantity * unitPrice
   * - taxAmount = grossAmount * taxRate
   * - netAmount = grossAmount + taxAmount
   */
  buildOrderEvent(
    input: CreateOrderEventInput,
    sequenceNumber: number
  ): OrderEvent {
    const grossAmount = this.calculateGrossAmount(input.quantity, input.unitPrice);
    const taxAmount = this.calculateTaxAmount(grossAmount, input.taxRate);
    const netAmount = this.calculateNetAmount(grossAmount, taxAmount);

    return {
      id: uuidv4(),
      externalOrderId: input.externalOrderId,
      partnerId: input.partnerId,
      sequenceNumber,
      productId: input.productId,
      customerId: input.customerId,
      quantity: input.quantity,
      unitPrice: this.roundToTwoDecimals(input.unitPrice),
      taxRate: input.taxRate,
      grossAmount: this.roundToTwoDecimals(grossAmount),
      taxAmount: this.roundToTwoDecimals(taxAmount),
      netAmount: this.roundToTwoDecimals(netAmount),
      transactionTime: input.transactionTime,
      processedAt: new Date().toISOString(),
      metadata: input.metadata
    };
  }

  /**
   * Full transformation from Partner A input to OrderEvent
   */
  fromPartnerA(input: PartnerAInput, sequenceNumber: number): OrderEvent {
    const createInput = this.transformPartnerA(input);
    return this.buildOrderEvent(createInput, sequenceNumber);
  }

  /**
   * Full transformation from Partner B input to OrderEvent
   */
  fromPartnerB(input: PartnerBInput, sequenceNumber: number): OrderEvent {
    const createInput = this.transformPartnerB(input);
    return this.buildOrderEvent(createInput, sequenceNumber);
  }

  /**
   * Transform based on partner ID
   */
  transform(
    partnerId: PartnerId,
    input: PartnerAInput | PartnerBInput,
    sequenceNumber: number
  ): OrderEvent {
    switch (partnerId) {
      case PartnerId.PARTNER_A:
        return this.fromPartnerA(input as PartnerAInput, sequenceNumber);
      case PartnerId.PARTNER_B:
        return this.fromPartnerB(input as PartnerBInput, sequenceNumber);
      default:
        throw new Error(`Unknown partner ID: ${partnerId}`);
    }
  }

  // ============ Private Helper Methods ============

  /**
   * Convert milliseconds timestamp to ISO 8601 string
   */
  private convertMsToISO8601(timestampMs: number): string {
    return new Date(timestampMs).toISOString();
  }

  /**
   * Normalize ISO 8601 timestamp (ensure consistent format)
   */
  private normalizeISO8601(timestamp: string): string {
    return new Date(timestamp).toISOString();
  }

  /**
   * Convert percentage (0-100) to decimal (0-1)
   */
  private convertPercentageToDecimal(percentage: number): number {
    return percentage / 100;
  }

  /**
   * Calculate gross amount: quantity * unitPrice
   */
  private calculateGrossAmount(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  }

  /**
   * Calculate tax amount: grossAmount * taxRate
   */
  private calculateTaxAmount(grossAmount: number, taxRate: number): number {
    return grossAmount * taxRate;
  }

  /**
   * Calculate net amount: grossAmount + taxAmount
   */
  private calculateNetAmount(grossAmount: number, taxAmount: number): number {
    return grossAmount + taxAmount;
  }

  /**
   * Round number to two decimal places (for currency)
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
