import { 
  PartnerAInput, 
  PartnerBInput, 
  PartnerId, 
  ValidationResult 
} from '../models';
import { PartnerAValidator } from './partner-a-validator';
import { PartnerBValidator } from './partner-b-validator';

/**
 * Factory for creating and managing partner validators
 * 
 * This service provides a unified interface for validating input
 * from different partners while maintaining the Open/Closed principle.
 */
export class ValidationService {
  private partnerAValidator: PartnerAValidator;
  private partnerBValidator: PartnerBValidator;

  constructor() {
    this.partnerAValidator = new PartnerAValidator();
    this.partnerBValidator = new PartnerBValidator();
  }

  /**
   * Validate Partner A input
   */
  validatePartnerA(input: unknown): ValidationResult<PartnerAInput> {
    return this.partnerAValidator.validate(input);
  }

  /**
   * Validate Partner B input
   */
  validatePartnerB(input: unknown): ValidationResult<PartnerBInput> {
    return this.partnerBValidator.validate(input);
  }

  /**
   * Validate input based on partner ID
   */
  validateByPartner(
    partnerId: PartnerId, 
    input: unknown
  ): ValidationResult<PartnerAInput | PartnerBInput> {
    switch (partnerId) {
      case PartnerId.PARTNER_A:
        return this.validatePartnerA(input);
      case PartnerId.PARTNER_B:
        return this.validatePartnerB(input);
      default:
        return {
          isValid: false,
          errors: [{
            field: 'partnerId',
            message: `Unknown partner: ${partnerId}`,
            receivedValue: partnerId,
            expectedType: 'PARTNER_A | PARTNER_B'
          }]
        };
    }
  }

  /**
   * Batch validate multiple inputs
   */
  validateBatch(
    partnerId: PartnerId,
    inputs: unknown[]
  ): Array<{ index: number; result: ValidationResult<PartnerAInput | PartnerBInput> }> {
    return inputs.map((input, index) => ({
      index,
      result: this.validateByPartner(partnerId, input)
    }));
  }
}
