import { PartnerAInput, ValidationResult } from '../models';
import { BaseValidator } from './base-validator';

/**
 * Validator for Partner A input format
 * 
 * Partner A Field Requirements:
 * - orderId: Required, non-empty string
 * - skuId: Required, non-empty string
 * - customerId: Required, non-empty string
 * - quantity: Required, positive integer
 * - unitPrice: Required, positive number
 * - taxRate: Required, decimal between 0 and 1
 * - transactionTimeMs: Required, valid timestamp in milliseconds
 * - metadata: Optional object
 */
export class PartnerAValidator extends BaseValidator<PartnerAInput> {
  /**
   * Validate Partner A input
   */
  validate(input: unknown): ValidationResult<PartnerAInput> {
    this.resetErrors();

    // Check if input is an object
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      this.addError('root', 'Input must be a valid object', input, 'object');
      return this.failure();
    }

    const obj = input as Record<string, unknown>;

    // Validate all required fields exist
    const hasOrderId = this.validateRequired(obj, 'orderId');
    const hasSkuId = this.validateRequired(obj, 'skuId');
    const hasCustomerId = this.validateRequired(obj, 'customerId');
    const hasQuantity = this.validateRequired(obj, 'quantity');
    const hasUnitPrice = this.validateRequired(obj, 'unitPrice');
    const hasTaxRate = this.validateRequired(obj, 'taxRate');
    const hasTransactionTimeMs = this.validateRequired(obj, 'transactionTimeMs');

    // If any required field is missing, return early
    if (!hasOrderId || !hasSkuId || !hasCustomerId || 
        !hasQuantity || !hasUnitPrice || !hasTaxRate || !hasTransactionTimeMs) {
      return this.failure();
    }

    // Validate field types and values
    const validOrderId = this.validateString(obj.orderId, 'orderId');
    const validSkuId = this.validateString(obj.skuId, 'skuId');
    const validCustomerId = this.validateString(obj.customerId, 'customerId');
    const validQuantity = this.validateQuantity(obj.quantity);
    const validUnitPrice = this.validatePositiveNumber(obj.unitPrice, 'unitPrice');
    const validTaxRate = this.validateTaxRate(obj.taxRate, 'taxRate', false);
    const validTimestamp = this.validateTimestampMs(obj.transactionTimeMs, 'transactionTimeMs');

    // If any validation failed, return failure
    if (!validOrderId || !validSkuId || !validCustomerId || 
        !validQuantity || !validUnitPrice || !validTaxRate || !validTimestamp) {
      return this.failure();
    }

    // Validate optional metadata if present
    if (obj.metadata !== undefined && obj.metadata !== null) {
      if (typeof obj.metadata !== 'object' || Array.isArray(obj.metadata)) {
        this.addError('metadata', 'Metadata must be an object', obj.metadata, 'object');
        return this.failure();
      }
    }

    // Build validated input object
    const validatedInput: PartnerAInput = {
      orderId: obj.orderId as string,
      skuId: obj.skuId as string,
      customerId: obj.customerId as string,
      quantity: obj.quantity as number,
      unitPrice: obj.unitPrice as number,
      taxRate: obj.taxRate as number,
      transactionTimeMs: obj.transactionTimeMs as number,
      ...(obj.metadata && { metadata: obj.metadata as Record<string, unknown> })
    };

    return this.success(validatedInput);
  }

  /**
   * Validate quantity is a positive integer
   */
  private validateQuantity(value: unknown): value is number {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(
        'quantity',
        'Quantity must be a valid number',
        value,
        'positive integer'
      );
      return false;
    }

    if (!Number.isInteger(value)) {
      this.addError(
        'quantity',
        'Quantity must be an integer',
        value,
        'positive integer'
      );
      return false;
    }

    if (value <= 0) {
      this.addError(
        'quantity',
        'Quantity must be a positive integer',
        value,
        'positive integer'
      );
      return false;
    }

    return true;
  }
}
