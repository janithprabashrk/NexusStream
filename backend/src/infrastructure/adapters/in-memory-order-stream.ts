import { EventEmitter } from 'events';
import {
  IOrderStreamPort,
  StreamEvent,
  ValidOrderPayload,
  ErrorOrderPayload,
  ValidOrderListener,
  ErrorOrderListener,
} from '../../domain/ports';

/**
 * In-memory implementation of order stream using Node.js EventEmitter.
 * Simulates message queue behavior for local development/testing.
 * In production, this would be replaced with AWS SQS adapter.
 */
export class InMemoryOrderStream implements IOrderStreamPort {
  private emitter: EventEmitter;
  private validOrderHistory: ValidOrderPayload[] = [];
  private errorOrderHistory: ErrorOrderPayload[] = [];

  constructor() {
    this.emitter = new EventEmitter();
    // Increase max listeners to avoid warnings in tests
    this.emitter.setMaxListeners(100);
  }

  /**
   * Emit a valid order event to all subscribers.
   */
  emitValidOrder(payload: ValidOrderPayload): void {
    this.validOrderHistory.push(payload);
    this.emitter.emit(StreamEvent.VALID_ORDER, payload);
  }

  /**
   * Emit an error order event to all subscribers.
   */
  emitErrorOrder(payload: ErrorOrderPayload): void {
    this.errorOrderHistory.push(payload);
    this.emitter.emit(StreamEvent.ERROR_ORDER, payload);
  }

  /**
   * Subscribe to valid order events.
   */
  onValidOrder(listener: ValidOrderListener): void {
    this.emitter.on(StreamEvent.VALID_ORDER, listener);
  }

  /**
   * Subscribe to error order events.
   */
  onErrorOrder(listener: ErrorOrderListener): void {
    this.emitter.on(StreamEvent.ERROR_ORDER, listener);
  }

  /**
   * Unsubscribe from valid order events.
   */
  offValidOrder(listener: ValidOrderListener): void {
    this.emitter.off(StreamEvent.VALID_ORDER, listener);
  }

  /**
   * Unsubscribe from error order events.
   */
  offErrorOrder(listener: ErrorOrderListener): void {
    this.emitter.off(StreamEvent.ERROR_ORDER, listener);
  }

  /**
   * Get count of valid order listeners.
   */
  getValidOrderListenerCount(): number {
    return this.emitter.listenerCount(StreamEvent.VALID_ORDER);
  }

  /**
   * Get count of error order listeners.
   */
  getErrorOrderListenerCount(): number {
    return this.emitter.listenerCount(StreamEvent.ERROR_ORDER);
  }

  /**
   * Get history of valid orders (useful for testing).
   */
  getValidOrderHistory(): ValidOrderPayload[] {
    return [...this.validOrderHistory];
  }

  /**
   * Get history of error orders (useful for testing).
   */
  getErrorOrderHistory(): ErrorOrderPayload[] {
    return [...this.errorOrderHistory];
  }

  /**
   * Clear all history (useful for testing).
   */
  clearHistory(): void {
    this.validOrderHistory = [];
    this.errorOrderHistory = [];
  }

  /**
   * Remove all listeners (useful for cleanup).
   */
  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}
