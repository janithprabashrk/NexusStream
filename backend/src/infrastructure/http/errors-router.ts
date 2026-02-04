import { Router, Request, Response, NextFunction } from 'express';
import { IErrorRepositoryPort, ErrorQueryFilters, ErrorPaginationOptions } from '../../domain/ports/error-repository.port';
import { PartnerId, ErrorCode } from '../../domain/models';

/**
 * Parse query parameters for error listing
 */
function parseQueryParams(query: Record<string, any>): {
  filters: ErrorQueryFilters;
  pagination: ErrorPaginationOptions;
} {
  const filters: ErrorQueryFilters = {};

  // Partner filter
  if (query.partnerId) {
    if (query.partnerId === 'PARTNER_A' || query.partnerId === 'A') {
      filters.partnerId = PartnerId.PARTNER_A;
    } else if (query.partnerId === 'PARTNER_B' || query.partnerId === 'B') {
      filters.partnerId = PartnerId.PARTNER_B;
    }
  }

  // Error code filter
  if (query.errorCode && Object.values(ErrorCode).includes(query.errorCode)) {
    filters.errorCode = query.errorCode as ErrorCode;
  }

  // Date filters
  if (query.fromDate) {
    const date = new Date(query.fromDate);
    if (!isNaN(date.getTime())) filters.fromDate = date;
  }
  if (query.toDate) {
    const date = new Date(query.toDate);
    if (!isNaN(date.getTime())) filters.toDate = date;
  }

  // Pagination
  const page = parseInt(query.page, 10) || 1;
  const pageSize = Math.min(parseInt(query.pageSize, 10) || 20, 100);
  const pagination: ErrorPaginationOptions = { page, pageSize };

  return { filters, pagination };
}

/**
 * Create errors router with dependency injection.
 * 
 * SPEC REFERENCE: Optional - "Errors View" API endpoints
 */
export function createErrorsRouter(errorRepository: IErrorRepositoryPort): Router {
  const router = Router();

  /**
   * GET /api/errors
   * List error events with optional filters and pagination
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filters, pagination } = parseQueryParams(req.query);
      const result = await errorRepository.findMany(filters, pagination);

      res.json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/errors/stats
   * Get error statistics
   */
  router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await errorRepository.getStatistics();

      res.json({
        status: 'success',
        statistics: stats,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/errors/:id
   * Get a single error event by ID
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const error = await errorRepository.findById(id);

      if (!error) {
        res.status(404).json({
          status: 'error',
          message: `Error event with ID '${id}' not found`,
        });
        return;
      }

      res.json({
        status: 'success',
        error,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
