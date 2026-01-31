import { EventEmitter } from 'events';
import { OrderEvent, ErrorEvent } from '../../domain/models';

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
  order: OrderEvent;
  receivedAt: string;
}

export interface ErrorOrderPayload {
  error: ErrorEvent;
  receivedAt: string;
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
  emitValidOrder(order: OrderEvent): void;
  
  /** Emit an error order to the stream */
  emitErrorOrder(error: ErrorEvent): void;
  
  /** Subscribe to valid orders */
  onValidOrder(listener: ValidOrderListener): void;
  
  /** Subscribe to error orders */
  onErrorOrder(listener: ErrorOrderListener): void;
  
  /** Unsubscribe from valid orders */
  offValidOrder(listener: ValidOrderListener): void;
  
  /** Unsubscribe from error orders */
  offErrorOrder(listener: ErrorOrderListener): void;
  
  /** Get count of valid orders emitted */
  getValidOrderCount(): number;
  
  /** Get count of error orders emitted */
  getErrorOrderCount(): number;
  
  /** Reset counters (for testing) */
  resetCounters(): void;
}
