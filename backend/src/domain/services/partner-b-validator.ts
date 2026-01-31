import { PartnerBInput, ValidationResult } from '../models';
import { BaseValidator } from './base-validator';

/**
 * Validator for Partner B input format
 * 
 * Partner B Field Requirements:
 * - transactionId: Required, non-empty string
 * - itemCode: Required, non-empty string
 * - clientId: Required, non-empty string
 * - qty: Required, positive integer
 * - price: Required, positive number
 * - tax: Required, percentage between 0 and 100
 * - purchaseTime: Required, valid ISO 8601 timestamp string
 * - notes: Optional string
 */
export class PartnerBValidator extends BaseValidator<PartnerBInput> {
  /**
   * Validate Partner B input
   */
  validate(input: unknown): ValidationResult<PartnerBInput> {
    this.resetErrors();

    // Check if input is an object
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      this.addError('root', 'Input must be a valid object', input, 'object');
      return this.failure();
    }

    const obj = input as Record<string, unknown>;

    // Validate all required fields exist
    const hasTransactionId = this.validateRequired(obj, 'transactionId');
    const hasItemCode = this.validateRequired(obj, 'itemCode');
    const hasClientId = this.validateRequired(obj, 'clientId');
    const hasQty = this.validateRequired(obj, 'qty');
    const hasPrice = this.validateRequired(obj, 'price');
    const hasTax = this.validateRequired(obj, 'tax');
    const hasPurchaseTime = this.validateRequired(obj, 'purchaseTime');

    // If any required field is missing, return early
    if (!hasTransactionId || !hasItemCode || !hasClientId || 
        !hasQty || !hasPrice || !hasTax || !hasPurchaseTime) {
      return this.failure();
    }

    // Validate field types and values
    const validTransactionId = this.validateString(obj.transactionId, 'transactionId');
    const validItemCode = this.validateString(obj.itemCode, 'itemCode');
    const validClientId = this.validateString(obj.clientId, 'clientId');
    const validQty = this.validateQuantity(obj.qty);
    const validPrice = this.validatePositiveNumber(obj.price, 'price');
    const validTax = this.validateTaxRate(obj.tax, 'tax', true); // Tax is percentage for Partner B
    const validPurchaseTime = this.validateISO8601Timestamp(obj.purchaseTime, 'purchaseTime');

    // If any validation failed, return failure
    if (!validTransactionId || !validItemCode || !validClientId || 
        !validQty || !validPrice || !validTax || !validPurchaseTime) {
      return this.failure();
    }

    // Validate optional notes if present
    if (obj.notes !== undefined && obj.notes !== null) {
      if (typeof obj.notes !== 'string') {
        this.addError('notes', 'Notes must be a string', obj.notes, 'string');
        return this.failure();
      }
    }

    // Build validated input object
    const validatedInput: PartnerBInput = {
      transactionId: obj.transactionId as string,
      itemCode: obj.itemCode as string,
      clientId: obj.clientId as string,
      qty: obj.qty as number,
      price: obj.price as number,
      tax: obj.tax as number,
      purchaseTime: obj.purchaseTime as string,
      ...(obj.notes && { notes: obj.notes as string })
    };

    return this.success(validatedInput);
  }

  /**
   * Validate quantity is a positive integer
   */
  private validateQuantity(value: unknown): value is number {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(
        'qty',
        'Quantity must be a valid number',
        value,
        'positive integer'
      );
      return false;
    }

    if (!Number.isInteger(value)) {
      this.addError(
        'qty',
        'Quantity must be an integer',
        value,
        'positive integer'
      );
      return false;
    }

    if (value <= 0) {
      this.addError(
        'qty',
        'Quantity must be a positive integer',
        value,
        'positive integer'
      );
      return false;
    }

    return true;
  }
}
