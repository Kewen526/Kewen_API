import { Request, Response } from 'express';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { ConnectionManager, DatabaseType } from '../services/database/ConnectorFactory';
import { decrypt } from '../utils/crypto';
import { CacheService } from '../services/CacheService';
import { WebhookService } from '../services/WebhookService';
import logger from '../utils/logger';

export class DynamicApiController {
  static async execute(req: Request, res: Response): Promise<Response> {
    const { version = 'v1', path } = req.params;
    const method = req.method;
    const startTime = Date.now();

    let apiLog: any;

    try {
      const apiPath = `/${path}`;

      const api = await prisma.api.findFirst({
        where: {
          path: apiPath,
          method: method as any,
          version,
          status: 'PUBLISHED',
        },
        include: {
          dataSource: true,
        },
      });

      if (!api) {
        return errorResponse(res, 'API not found', 404);
      }

      if (api.requireAuth && !(req as any).user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      if (api.ipWhitelist && api.ipWhitelist.length > 0) {
        const clientIp = req.ip || req.socket.remoteAddress || '';
        if (!api.ipWhitelist.includes(clientIp)) {
          return errorResponse(res, 'IP address not allowed', 403);
        }
      }

      const params = {
        ...req.query,
        ...req.params,
        ...req.body,
      };

      const cacheKey = CacheService.generateCacheKey(api.id, params);

      if (api.cacheEnabled && method === 'GET') {
        const cached = await CacheService.get(cacheKey);
        if (cached) {
          logger.info(`Cache hit for API ${api.name}`);
          return successResponse(res, cached);
        }
      }

      const sql = this.replacePlaceholders(api.sql, params);

      const connector = await ConnectionManager.getConnection(
        api.dataSource.id,
        api.dataSource.type as DatabaseType,
        {
          host: api.dataSource.host,
          port: api.dataSource.port,
          database: api.dataSource.database,
          username: api.dataSource.username,
          password: decrypt(api.dataSource.password),
          ssl: api.dataSource.ssl,
          sslConfig: api.dataSource.sslConfig,
          options: api.dataSource.options,
        }
      );

      const result = await connector.execute(sql);

      let responseData = result.rows;

      if (api.responseMapping) {
        responseData = this.applyResponseMapping(responseData, api.responseMapping as any);
      }

      const responseTime = Date.now() - startTime;

      apiLog = await prisma.apiLog.create({
        data: {
          apiId: api.id,
          userId: (req as any).user?.userId,
          method,
          path: apiPath,
          query: req.query as any,
          body: req.body,
          headers: this.sanitizeHeaders(req.headers),
          statusCode: 200,
          responseTime,
          ip: req.ip || req.socket.remoteAddress || '',
          userAgent: req.headers['user-agent'],
        },
      });

      this.updateMetrics(api.id, true, responseTime);

      if (api.cacheEnabled && method === 'GET') {
        await CacheService.set(cacheKey, responseData, api.cacheTtl || undefined);
      }

      await WebhookService.trigger('api.executed', {
        api: { id: api.id, name: api.name, path: apiPath },
        result: { rowCount: result.rowCount, responseTime },
      });

      return successResponse(res, responseData);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      logger.error('Dynamic API execution error:', error);

      if (apiLog) {
        await prisma.apiLog.update({
          where: { id: apiLog.id },
          data: {
            statusCode: 500,
            errorMessage: error.message,
          },
        });
      }

      this.updateMetrics(req.params.apiId, false, responseTime);

      return errorResponse(res, 'API execution failed', 500, error.message);
    }
  }

  private static replacePlaceholders(sql: string, params: Record<string, any>): string {
    let processedSql = sql;

    Object.keys(params).forEach((key) => {
      const placeholder = new RegExp(`\\$\\{${key}\\}|:${key}`, 'g');
      const value = params[key];

      if (typeof value === 'string') {
        processedSql = processedSql.replace(placeholder, `'${value.replace(/'/g, "''")}'`);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        processedSql = processedSql.replace(placeholder, String(value));
      } else if (value === null || value === undefined) {
        processedSql = processedSql.replace(placeholder, 'NULL');
      } else {
        processedSql = processedSql.replace(placeholder, `'${JSON.stringify(value)}'`);
      }
    });

    return processedSql;
  }

  private static applyResponseMapping(data: any[], mapping: Record<string, string>): any[] {
    return data.map((row) => {
      const mapped: Record<string, any> = {};

      Object.keys(mapping).forEach((newKey) => {
        const originalKey = mapping[newKey];
        mapped[newKey] = row[originalKey];
      });

      return mapped;
    });
  }

  private static sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private static async updateMetrics(
    apiId: string,
    success: boolean,
    responseTime: number
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const metric = await prisma.apiMetric.findUnique({
        where: {
          apiId_date: {
            apiId,
            date: today,
          },
        },
      });

      if (metric) {
        await prisma.apiMetric.update({
          where: { id: metric.id },
          data: {
            totalRequests: { increment: 1 },
            successRequests: success ? { increment: 1 } : undefined,
            failedRequests: !success ? { increment: 1 } : undefined,
            avgResponseTime: (metric.avgResponseTime * metric.totalRequests + responseTime) / (metric.totalRequests + 1),
            maxResponseTime: Math.max(metric.maxResponseTime, responseTime),
            minResponseTime: Math.min(metric.minResponseTime, responseTime),
          },
        });
      } else {
        await prisma.apiMetric.create({
          data: {
            apiId,
            date: today,
            totalRequests: 1,
            successRequests: success ? 1 : 0,
            failedRequests: success ? 0 : 1,
            avgResponseTime: responseTime,
            maxResponseTime: responseTime,
            minResponseTime: responseTime,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to update metrics:', error);
    }
  }
}
