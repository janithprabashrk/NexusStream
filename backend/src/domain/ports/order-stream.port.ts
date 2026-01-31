import { OrderEvent, PartnerId } from '../models';

// Re-export PartnerId for convenience
export { PartnerId } from '../models';

/**
 * Event types for the order processing streams
 */
export enum StreamEvent {
  VALID_ORDER = 'valid_order',
  ERROR_ORDER = 'error_order'
}

/**
 * Stream event payload types
 */
export interface ValidOrderPayload {
  orderEvent: OrderEvent;
  receivedAt: Date;
}

export interface ErrorOrderPayload {
  partnerId: PartnerId;
  originalOrderId: string;
  errors: string[];
  rawInput: unknown;
  timestamp: Date;
}

/**
 * Stream listener function types
 */
export type ValidOrderListener = (payload: ValidOrderPayload) => void | Promise<void>;
export type ErrorOrderListener = (payload: ErrorOrderPayload) => void | Promise<void>;

/**
 * Port interface for order streams
 * This abstraction allows swapping implementations (EventEmitter, SQS, Kafka, etc.)
 */
export interface IOrderStreamPort {
  /** Emit a valid order to the stream */
  emitValidOrder(payload: ValidOrderPayload): void;
  
  /** Emit an error order to the stream */
  emitErrorOrder(payload: ErrorOrderPayload): void;
  
  /** Subscribe to valid orders */
  onValidOrder(listener: ValidOrderListener): void;
  
  /** Subscribe to error orders */
  onErrorOrder(listener: ErrorOrderListener): void;
  
  /** Unsubscribe from valid orders */
  offValidOrder(listener: ValidOrderListener): void;
  
  /** Unsubscribe from error orders */
  offErrorOrder(listener: ErrorOrderListener): void;
}
