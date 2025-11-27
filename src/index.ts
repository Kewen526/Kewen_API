import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import config from './config/env';
import { connectRedis } from './config/redis';
import prisma from './config/database';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './config/swagger';
import { SchedulerService } from './services/SchedulerService';
import { ConnectionManager } from './services/database/ConnectorFactory';

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({ origin: config.cors.origin, credentials: true }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(requestLogger);
    this.app.use(globalRateLimiter);
  }

  private initializeRoutes(): void {
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to Kewen API Platform',
        version: '1.0.0',
        docs: '/api-docs',
        features: [
          'Multi-database support (MySQL, PostgreSQL, MongoDB, Redis, SQL Server)',
          'Dynamic API generation from SQL queries',
          'API versioning and lifecycle management',
          'Real-time monitoring and analytics',
          'Smart caching with Redis',
          'Rate limiting and security',
          'Webhook integration',
          'Scheduled jobs',
          'Team collaboration',
          'Data import/export',
          'API documentation auto-generation',
        ],
      });
    });

    this.app.use('/api', routes);
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await this.connectDatabase();
      await this.connectCache();
      await this.initializeServices();

      this.app.listen(config.port, () => {
        logger.info(`🚀 Kewen API Platform started successfully`);
        logger.info(`📡 Server is running on http://${config.host}:${config.port}`);
        logger.info(`📚 API Documentation: http://${config.host}:${config.port}/api-docs`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async connectDatabase(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async connectCache(): Promise<void> {
    try {
      await connectRedis();
      logger.info('✅ Redis cache connected successfully');
    } catch (error) {
      logger.warn('⚠️  Redis connection failed (cache disabled):', error);
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      if (config.nodeEnv === 'production') {
        await SchedulerService.initialize();
        logger.info('✅ Scheduler service initialized');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize services:', error);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      try {
        await ConnectionManager.closeAllConnections();
        logger.info('✅ All database connections closed');

        await prisma.$disconnect();
        logger.info('✅ Platform database disconnected');

        SchedulerService.shutdown();
        logger.info('✅ Scheduler service stopped');

        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

const server = new Server();
server.start();

export default server;
