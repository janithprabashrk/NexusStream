import { Router, Request, Response, NextFunction } from 'express';
import { OrderQueryService } from '../../application/services/order-query-service';
import { PartnerId } from '../../domain/models';
import { OrderQueryFilters, PaginationOptions, SortOptions } from '../../domain/ports';

/**
 * Parse query parameters for order listing
 */
function parseQueryParams(query: Record<string, any>): {
  filters: OrderQueryFilters;
  pagination: PaginationOptions;
  sort?: SortOptions;
} {
  const filters: OrderQueryFilters = {};
  
  // Partner filter
  if (query.partnerId) {
    if (query.partnerId === 'PARTNER_A' || query.partnerId === 'A') {
      filters.partnerId = PartnerId.PARTNER_A;
    } else if (query.partnerId === 'PARTNER_B' || query.partnerId === 'B') {
      filters.partnerId = PartnerId.PARTNER_B;
    }
  }
  
  // String filters
  if (query.customerId) filters.customerId = query.customerId;
  if (query.productId) filters.productId = query.productId;
  
  // Date filters
  if (query.fromDate) {
    const date = new Date(query.fromDate);
    if (!isNaN(date.getTime())) filters.fromDate = date;
  }
  if (query.toDate) {
    const date = new Date(query.toDate);
    if (!isNaN(date.getTime())) filters.toDate = date;
  }
  
  // Amount filters
  if (query.minAmount) {
    const amount = parseFloat(query.minAmount);
    if (!isNaN(amount)) filters.minAmount = amount;
  }
  if (query.maxAmount) {
    const amount = parseFloat(query.maxAmount);
    if (!isNaN(amount)) filters.maxAmount = amount;
  }
  
  // Pagination
  const page = parseInt(query.page, 10) || 1;
  const pageSize = Math.min(parseInt(query.pageSize, 10) || 20, 100); // Max 100 per page
  const pagination: PaginationOptions = { page, pageSize };
  
  // Sorting
  let sort: SortOptions | undefined;
  if (query.sortBy) {
    const validFields = ['processedAt', 'transactionTime', 'grossAmount', 'sequenceNumber'];
    if (validFields.includes(query.sortBy)) {
      sort = {
        field: query.sortBy as SortOptions['field'],
        direction: query.sortOrder === 'asc' ? 'asc' : 'desc',
      };
    }
  }
  
  return { filters, pagination, sort };
}

/**
 * Create orders router with dependency injection.
 */
export function createOrdersRouter(queryService: OrderQueryService): Router {
  const router = Router();

  /**
   * GET /api/orders
   * List orders with optional filters and pagination
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filters, pagination, sort } = parseQueryParams(req.query);
      
      const result = await queryService.listOrders({
        filters,
        pagination,
        sort,
      });
      
      res.json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/orders/stats
   * Get order statistics
   */
  router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filters } = parseQueryParams(req.query);
      const stats = await queryService.getStatistics(filters);
      
      res.json({
        status: 'success',
        statistics: stats,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/orders/by-partner/:partnerId
   * Get orders for a specific partner
   */
  router.get('/by-partner/:partnerId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partnerParam = req.params.partnerId.toUpperCase();
      let partnerId: PartnerId;
      
      if (partnerParam === 'A' || partnerParam === 'PARTNER_A') {
        partnerId = PartnerId.PARTNER_A;
      } else if (partnerParam === 'B' || partnerParam === 'PARTNER_B') {
        partnerId = PartnerId.PARTNER_B;
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Invalid partner ID. Use A, B, PARTNER_A, or PARTNER_B',
        });
        return;
      }
      
      const { pagination } = parseQueryParams(req.query);
      const result = await queryService.getOrdersByPartner(partnerId, pagination);
      
      res.json({
        status: 'success',
        partnerId,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/orders/by-customer/:customerId
   * Get orders for a specific customer
   */
  router.get('/by-customer/:customerId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerId } = req.params;
      const { pagination } = parseQueryParams(req.query);
      
      const result = await queryService.getOrdersByCustomer(customerId, pagination);
      
      res.json({
        status: 'success',
        customerId,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/orders/:id
   * Get a single order by ID
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await queryService.getOrderById(id);
      
      if (!result.found) {
        res.status(404).json({
          status: 'error',
          message: `Order with ID '${id}' not found`,
        });
        return;
      }
      
      res.json({
        status: 'success',
        order: result.order,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/orders/external/:partnerId/:externalId
   * Get order by external ID and partner
   */
  router.get('/external/:partnerId/:externalId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partnerParam = req.params.partnerId.toUpperCase();
      const { externalId } = req.params;
      
      let partnerId: PartnerId;
      if (partnerParam === 'A' || partnerParam === 'PARTNER_A') {
        partnerId = PartnerId.PARTNER_A;
      } else if (partnerParam === 'B' || partnerParam === 'PARTNER_B') {
        partnerId = PartnerId.PARTNER_B;
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Invalid partner ID. Use A, B, PARTNER_A, or PARTNER_B',
        });
        return;
      }
      
      const result = await queryService.getOrderByExternalId(externalId, partnerId);
      
      if (!result.found) {
        res.status(404).json({
          status: 'error',
          message: `Order with external ID '${externalId}' for partner '${partnerId}' not found`,
        });
        return;
      }
      
      res.json({
        status: 'success',
        order: result.order,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
