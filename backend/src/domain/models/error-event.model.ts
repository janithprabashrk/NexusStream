/**
 * Error event for invalid orders
 * Captures validation/processing errors for monitoring and debugging
 */
export interface ErrorEvent {
  /** Unique identifier for this error event */
  id: string;
  
  /** Partner that submitted the order */
  partnerId: string;
  
  /** Original order ID if available */
  externalOrderId?: string;
  
  /** Error code for categorization */
  errorCode: ErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Detailed error information */
  details: ValidationError[];
  
  /** Original payload that caused the error */
  originalPayload: unknown;
  
  /** When this error occurred (ISO 8601) */
  timestamp: string;
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  
  /** Error message describing the issue */
  message: string;
  
  /** The invalid value received */
  receivedValue?: unknown;
  
  /** Expected type or format */
  expectedType?: string;
}

/**
 * Error codes for categorization
 */
export enum ErrorCode {
  // Validation errors
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  INVALID_VALUE = 'INVALID_VALUE',
  NULL_VALUE = 'NULL_VALUE',
  
  // Numeric validation errors
  NEGATIVE_NUMBER = 'NEGATIVE_NUMBER',
  ZERO_VALUE = 'ZERO_VALUE',
  NOT_A_NUMBER = 'NOT_A_NUMBER',
  
  // Timestamp errors
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
  FUTURE_TIMESTAMP = 'FUTURE_TIMESTAMP',
  
  // Processing errors
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',
  TRANSFORMATION_ERROR = 'TRANSFORMATION_ERROR',
  UNKNOWN_PARTNER = 'UNKNOWN_PARTNER',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Validation result wrapper
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
}
