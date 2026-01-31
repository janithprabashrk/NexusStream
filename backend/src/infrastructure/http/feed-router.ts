import { Router, Request, Response, NextFunction } from 'express';
import { FeedHandler } from '../../application/services/feed-handler';
import { PartnerAInput, PartnerBInput } from '../../domain/models';

/**
 * HTTP response for successful feed processing.
 */
interface FeedSuccessResponse {
  status: 'accepted';
  orderId: string;
  partnerId: string;
  sequenceNumber: number;
}

/**
 * HTTP response for failed feed processing.
 */
interface FeedErrorResponse {
  status: 'rejected';
  orderId: string;
  partnerId: string;
  errors: string[];
}

/**
 * HTTP response for batch processing.
 */
interface BatchResponse {
  total: number;
  accepted: number;
  rejected: number;
  results: (FeedSuccessResponse | FeedErrorResponse)[];
}

/**
 * Create feed router with dependency injection.
 */
export function createFeedRouter(feedHandler: FeedHandler): Router {
  const router = Router();

  /**
   * POST /api/feed/partner-a
   * Process a single Partner A order.
   */
  router.post('/partner-a', (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as PartnerAInput;

      // Basic request validation
      if (!input || typeof input !== 'object') {
        res.status(400).json({
          status: 'error',
          message: 'Request body must be a valid JSON object',
        });
        return;
      }

      const result = feedHandler.processPartnerAOrder(input);

      if (result.success) {
        const response: FeedSuccessResponse = {
          status: 'accepted',
          orderId: result.orderId,
          partnerId: result.partnerId,
          sequenceNumber: result.sequenceNumber!,
        };
        res.status(202).json(response);
      } else {
        const response: FeedErrorResponse = {
          status: 'rejected',
          orderId: result.orderId,
          partnerId: result.partnerId,
          errors: result.errors || [],
        };
        res.status(422).json(response);
      }
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/feed/partner-b
   * Process a single Partner B order.
   */
  router.post('/partner-b', (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as PartnerBInput;

      // Basic request validation
      if (!input || typeof input !== 'object') {
        res.status(400).json({
          status: 'error',
          message: 'Request body must be a valid JSON object',
        });
        return;
      }

      const result = feedHandler.processPartnerBOrder(input);

      if (result.success) {
        const response: FeedSuccessResponse = {
          status: 'accepted',
          orderId: result.orderId,
          partnerId: result.partnerId,
          sequenceNumber: result.sequenceNumber!,
        };
        res.status(202).json(response);
      } else {
        const response: FeedErrorResponse = {
          status: 'rejected',
          orderId: result.orderId,
          partnerId: result.partnerId,
          errors: result.errors || [],
        };
        res.status(422).json(response);
      }
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/feed/partner-a/batch
   * Process a batch of Partner A orders.
   */
  router.post('/partner-a/batch', (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputs = req.body as PartnerAInput[];

      if (!Array.isArray(inputs)) {
        res.status(400).json({
          status: 'error',
          message: 'Request body must be an array of orders',
        });
        return;
      }

      const results = feedHandler.processPartnerABatch(inputs);

      const response: BatchResponse = {
        total: results.length,
        accepted: results.filter((r) => r.success).length,
        rejected: results.filter((r) => !r.success).length,
        results: results.map((r) =>
          r.success
            ? {
                status: 'accepted' as const,
                orderId: r.orderId,
                partnerId: r.partnerId,
                sequenceNumber: r.sequenceNumber!,
              }
            : {
                status: 'rejected' as const,
                orderId: r.orderId,
                partnerId: r.partnerId,
                errors: r.errors || [],
              }
        ),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/feed/partner-b/batch
   * Process a batch of Partner B orders.
   */
  router.post('/partner-b/batch', (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputs = req.body as PartnerBInput[];

      if (!Array.isArray(inputs)) {
        res.status(400).json({
          status: 'error',
          message: 'Request body must be an array of orders',
        });
        return;
      }

      const results = feedHandler.processPartnerBBatch(inputs);

      const response: BatchResponse = {
        total: results.length,
        accepted: results.filter((r) => r.success).length,
        rejected: results.filter((r) => !r.success).length,
        results: results.map((r) =>
          r.success
            ? {
                status: 'accepted' as const,
                orderId: r.orderId,
                partnerId: r.partnerId,
                sequenceNumber: r.sequenceNumber!,
              }
            : {
                status: 'rejected' as const,
                orderId: r.orderId,
                partnerId: r.partnerId,
                errors: r.errors || [],
              }
        ),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
