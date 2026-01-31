import express, { Express } from 'express';
import { createFeedRouter, createOrdersRouter, errorHandler, notFoundHandler } from './infrastructure/http';
import { FeedHandler } from './application/services/feed-handler';
import { OrderQueryService } from './application/services/order-query-service';
import { ValidationService } from './domain/services/validation-service';
import { OrderTransformer } from './domain/services/order-transformer';
import { InMemoryOrderStream, InMemorySequenceManager, InMemoryOrderRepository, FileOrderRepository, FileSequenceManager } from './infrastructure/adapters';
import { IOrderRepositoryPort, ISequenceManagerPort } from './domain/ports';

/**
 * Application container for dependency injection.
 */
export interface AppContainer {
  orderStream: InMemoryOrderStream;
  sequenceManager: ISequenceManagerPort;
  orderRepository: IOrderRepositoryPort;
  validationService: ValidationService;
  transformer: OrderTransformer;
  feedHandler: FeedHandler;
  orderQueryService: OrderQueryService;
}

/**
 * Container options for configuring persistence.
 */
export interface ContainerOptions {
  /** Use file-based persistence (default: true in production) */
  usePersistence?: boolean;
  /** Data directory for file persistence (default: './data') */
  dataDir?: string;
}

/**
 * Create and configure the application container.
 */
export function createContainer(options: ContainerOptions = {}): AppContainer {
  const usePersistence = options.usePersistence ?? (process.env.NODE_ENV !== 'test');
  const dataDir = options.dataDir ?? './data';

  // Infrastructure layer - use file-based or in-memory based on options
  const orderStream = new InMemoryOrderStream();
  
  let sequenceManager: ISequenceManagerPort;
  let orderRepository: IOrderRepositoryPort;

  if (usePersistence) {
    console.log('💾 Using file-based persistence');
    sequenceManager = new FileSequenceManager(dataDir);
    orderRepository = new FileOrderRepository(dataDir);
  } else {
    console.log('🧠 Using in-memory storage (no persistence)');
    sequenceManager = new InMemorySequenceManager();
    orderRepository = new InMemoryOrderRepository();
  }

  // Domain services
  const validationService = new ValidationService();
  const transformer = new OrderTransformer();

  // Application services
  const feedHandler = new FeedHandler(
    validationService,
    transformer,
    orderStream,
    sequenceManager
  );
  
  const orderQueryService = new OrderQueryService(orderRepository);

  // Subscribe to valid orders stream to persist orders
  orderStream.onValidOrder(async (payload) => {
    await orderRepository.save(payload.orderEvent);
  });

  return {
    orderStream,
    sequenceManager,
    orderRepository,
    validationService,
    transformer,
    feedHandler,
    orderQueryService,
  };
}

/**
 * Create and configure the Express application.
 */
export function createApp(container?: AppContainer): Express {
  const app = express();
  const appContainer = container ?? createContainer();

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/feed', createFeedRouter(appContainer.feedHandler));
  app.use('/api/orders', createOrdersRouter(appContainer.orderQueryService));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the server.
 */
export function startServer(port: number = 3000): void {
  const container = createContainer();
  const app = createApp(container);

  // Subscribe to stream events for logging
  container.orderStream.onValidOrder((payload) => {
    console.log(`[VALID_ORDER] ${payload.orderEvent.partnerId}:${payload.orderEvent.externalOrderId} seq=${payload.orderEvent.sequenceNumber}`);
  });

  container.orderStream.onErrorOrder((payload) => {
    console.log(`[ERROR_ORDER] ${payload.partnerId}:${payload.originalOrderId} errors=${payload.errors.length}`);
  });

  app.listen(port, () => {
    console.log(`🚀 NexusStream server running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📥 Partner A endpoint: POST http://localhost:${port}/api/feed/partner-a`);
    console.log(`📥 Partner B endpoint: POST http://localhost:${port}/api/feed/partner-b`);
    console.log(`📋 Orders endpoint: GET http://localhost:${port}/api/orders`);
    console.log(`📈 Stats endpoint: GET http://localhost:${port}/api/orders/stats`);
  });
}

// Run server if this file is executed directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  startServer(port);
}
