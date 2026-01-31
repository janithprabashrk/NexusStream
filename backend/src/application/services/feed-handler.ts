import { PartnerId } from '../../domain/models';
import { PartnerAInput, PartnerBInput } from '../../domain/models';
import { ValidationService } from '../../domain/services/validation-service';
import { OrderTransformer } from '../../domain/services/order-transformer';
import { IOrderStreamPort, ISequenceManagerPort } from '../../domain/ports';

/**
 * Result of processing a feed request.
 */
export interface FeedProcessingResult {
  success: boolean;
  orderId: string;
  partnerId: PartnerId;
  sequenceNumber?: number;
  errors?: string[];
}

/**
 * Feed Handler Service - Application layer orchestrator.
 * Coordinates validation, transformation, sequencing, and stream routing.
 * 
 * Responsibilities:
 * - Accept raw partner input
 * - Validate using ValidationService
 * - Transform using OrderTransformer
 * - Assign sequence numbers
 * - Route to appropriate stream (valid_orders or error_orders)
 */
export class FeedHandler {
  constructor(
    private readonly validationService: ValidationService,
    private readonly transformer: OrderTransformer,
    private readonly orderStream: IOrderStreamPort,
    private readonly sequenceManager: ISequenceManagerPort
  ) {}

  /**
   * Process a Partner A order feed.
   */
  processPartnerAOrder(input: PartnerAInput): FeedProcessingResult {
    const partnerId = PartnerId.PARTNER_A;
    const orderId = input.orderId;

    // Step 1: Validate
    const validationResult = this.validationService.validatePartnerA(input);

    if (!validationResult.isValid) {
      // Route to error stream
      this.orderStream.emitErrorOrder({
        partnerId,
        originalOrderId: orderId,
        errors: validationResult.errors,
        rawInput: input,
        timestamp: new Date(),
      });

      return {
        success: false,
        orderId,
        partnerId,
        errors: validationResult.errors,
      };
    }

    // Step 2: Get next sequence number
    const sequenceNumber = this.sequenceManager.getNextSequence(partnerId);

    // Step 3: Transform to OrderEvent
    const orderEvent = this.transformer.transformPartnerA(input, sequenceNumber);

    // Step 4: Route to valid orders stream
    this.orderStream.emitValidOrder({
      orderEvent,
      receivedAt: new Date(),
    });

    return {
      success: true,
      orderId,
      partnerId,
      sequenceNumber,
    };
  }

  /**
   * Process a Partner B order feed.
   */
  processPartnerBOrder(input: PartnerBInput): FeedProcessingResult {
    const partnerId = PartnerId.PARTNER_B;
    const orderId = input.transactionId;

    // Step 1: Validate
    const validationResult = this.validationService.validatePartnerB(input);

    if (!validationResult.isValid) {
      // Route to error stream
      this.orderStream.emitErrorOrder({
        partnerId,
        originalOrderId: orderId,
        errors: validationResult.errors,
        rawInput: input,
        timestamp: new Date(),
      });

      return {
        success: false,
        orderId,
        partnerId,
        errors: validationResult.errors,
      };
    }

    // Step 2: Get next sequence number
    const sequenceNumber = this.sequenceManager.getNextSequence(partnerId);

    // Step 3: Transform to OrderEvent
    const orderEvent = this.transformer.transformPartnerB(input, sequenceNumber);

    // Step 4: Route to valid orders stream
    this.orderStream.emitValidOrder({
      orderEvent,
      receivedAt: new Date(),
    });

    return {
      success: true,
      orderId,
      partnerId,
      sequenceNumber,
    };
  }

  /**
   * Process batch of Partner A orders.
   * Returns results for each order in the batch.
   */
  processPartnerABatch(inputs: PartnerAInput[]): FeedProcessingResult[] {
    return inputs.map((input) => this.processPartnerAOrder(input));
  }

  /**
   * Process batch of Partner B orders.
   * Returns results for each order in the batch.
   */
  processPartnerBBatch(inputs: PartnerBInput[]): FeedProcessingResult[] {
    return inputs.map((input) => this.processPartnerBOrder(input));
  }
}
