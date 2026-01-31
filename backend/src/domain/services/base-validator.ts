import { ValidationError, ValidationResult, ErrorCode } from '../models';

/**
 * Base Validator class with common validation utilities
 */
export abstract class BaseValidator<T> {
  protected errors: ValidationError[] = [];

  /**
   * Validate the input and return a result
   */
  abstract validate(input: unknown): ValidationResult<T>;

  /**
   * Reset errors for a new validation
   */
  protected resetErrors(): void {
    this.errors = [];
  }

  /**
   * Add a validation error
   */
  protected addError(
    field: string,
    message: string,
    receivedValue?: unknown,
    expectedType?: string
  ): void {
    this.errors.push({
      field,
      message,
      receivedValue,
      expectedType
    });
  }

  /**
   * Check if a value is null or undefined
   */
  protected isNullOrUndefined(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }

  /**
   * Validate required field exists and is not null/undefined
   */
  protected validateRequired(
    obj: Record<string, unknown>,
    field: string
  ): boolean {
    if (!(field in obj)) {
      this.addError(
        field,
        `Missing required field: ${field}`,
        undefined,
        'required'
      );
      return false;
    }
    
    if (this.isNullOrUndefined(obj[field])) {
      this.addError(
        field,
        `Field '${field}' cannot be null or undefined`,
        obj[field],
        'non-null'
      );
      return false;
    }
    
    return true;
  }

  /**
   * Validate that a value is a string
   */
  protected validateString(
    value: unknown,
    field: string,
    minLength: number = 1
  ): value is string {
    if (typeof value !== 'string') {
      this.addError(
        field,
        `Field '${field}' must be a string`,
        value,
        'string'
      );
      return false;
    }
    
    if (value.trim().length < minLength) {
      this.addError(
        field,
        `Field '${field}' must have at least ${minLength} character(s)`,
        value,
        `string (min length: ${minLength})`
      );
      return false;
    }
    
    return true;
  }

  /**
   * Validate that a value is a positive number
   */
  protected validatePositiveNumber(
    value: unknown,
    field: string,
    allowZero: boolean = false
  ): value is number {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(
        field,
        `Field '${field}' must be a valid number`,
        value,
        'number'
      );
      return false;
    }
    
    if (!allowZero && value <= 0) {
      this.addError(
        field,
        `Field '${field}' must be a positive number`,
        value,
        'positive number'
      );
      return false;
    }
    
    if (allowZero && value < 0) {
      this.addError(
        field,
        `Field '${field}' cannot be negative`,
        value,
        'non-negative number'
      );
      return false;
    }
    
    return true;
  }

  /**
   * Validate that a value is a non-negative number (including zero)
   */
  protected validateNonNegativeNumber(
    value: unknown,
    field: string
  ): value is number {
    return this.validatePositiveNumber(value, field, true);
  }

  /**
   * Validate that a value is a valid timestamp in milliseconds
   */
  protected validateTimestampMs(
    value: unknown,
    field: string
  ): value is number {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(
        field,
        `Field '${field}' must be a valid timestamp (number)`,
        value,
        'timestamp (milliseconds)'
      );
      return false;
    }
    
    // Reasonable timestamp range (year 2000 to 100 years from now)
    const minTimestamp = 946684800000; // Jan 1, 2000
    const maxTimestamp = Date.now() + (100 * 365 * 24 * 60 * 60 * 1000);
    
    if (value < minTimestamp || value > maxTimestamp) {
      this.addError(
        field,
        `Field '${field}' must be a valid timestamp in milliseconds`,
        value,
        'timestamp (milliseconds since Unix epoch)'
      );
      return false;
    }
    
    return true;
  }

  /**
   * Validate that a value is a valid ISO 8601 timestamp string
   */
  protected validateISO8601Timestamp(
    value: unknown,
    field: string
  ): value is string {
    if (typeof value !== 'string') {
      this.addError(
        field,
        `Field '${field}' must be a string`,
        value,
        'ISO 8601 timestamp string'
      );
      return false;
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      this.addError(
        field,
        `Field '${field}' must be a valid ISO 8601 timestamp`,
        value,
        'ISO 8601 timestamp (e.g., 2024-01-15T10:30:00.000Z)'
      );
      return false;
    }
    
    return true;
  }

  /**
   * Validate tax rate is within valid range (0-1 for decimal, 0-100 for percentage)
   */
  protected validateTaxRate(
    value: unknown,
    field: string,
    isPercentage: boolean = false
  ): value is number {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(
        field,
        `Field '${field}' must be a valid number`,
        value,
        'number'
      );
      return false;
    }
    
    const maxValue = isPercentage ? 100 : 1;
    
    if (value < 0 || value > maxValue) {
      this.addError(
        field,
        `Field '${field}' must be between 0 and ${maxValue}`,
        value,
        isPercentage ? 'percentage (0-100)' : 'decimal (0-1)'
      );
      return false;
    }
    
    return true;
  }

  /**
   * Create successful validation result
   */
  protected success(data: T): ValidationResult<T> {
    return {
      isValid: true,
      data,
      errors: []
    };
  }

  /**
   * Create failed validation result
   */
  protected failure(): ValidationResult<T> {
    return {
      isValid: false,
      errors: [...this.errors]
    };
  }
}
