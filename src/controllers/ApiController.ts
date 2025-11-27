import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { SqlValidator } from '../services/SqlValidator';
import { CacheService } from '../services/CacheService';
import { WebhookService } from '../services/WebhookService';

export class ApiController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    const {
      name,
      path,
      method,
      version,
      dataSourceId,
      sql,
      parameters,
      responseMapping,
      cacheEnabled,
      cacheTtl,
      rateLimitEnabled,
      rateLimit,
      ipWhitelist,
      requireAuth,
      description,
      tags,
    } = req.body;
    const { userId } = req.user!;

    const validation = SqlValidator.validateSql(sql, method !== 'GET');
    if (!validation.valid) {
      return errorResponse(res, validation.error!, 400);
    }

    const existingApi = await prisma.api.findUnique({
      where: {
        path_method_version: {
          path,
          method,
          version: version || 'v1',
        },
      },
    });

    if (existingApi) {
      return errorResponse(res, 'API with this path, method, and version already exists', 400);
    }

    const api = await prisma.api.create({
      data: {
        name,
        path,
        method,
        version: version || 'v1',
        dataSourceId,
        sql,
        parameters,
        responseMapping,
        cacheEnabled: cacheEnabled || false,
        cacheTtl,
        rateLimitEnabled: rateLimitEnabled !== false,
        rateLimit,
        ipWhitelist: ipWhitelist || [],
        requireAuth: requireAuth !== false,
        description,
        tags: tags || [],
        createdBy: userId,
      },
    });

    await WebhookService.trigger('api.created', { api });

    return successResponse(res, api, 'API created successfully', 201);
  }

  static async list(req: AuthRequest, res: Response): Promise<Response> {
    const { page = 1, pageSize = 20, search, status, method } = req.query;
    const { userId, role } = req.user!;

    const where: any = role === 'ADMIN' ? {} : { createdBy: userId };

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { path: { contains: search as string } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    const [total, apis] = await Promise.all([
      prisma.api.count({ where }),
      prisma.api.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          dataSource: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginatedResponse(res, apis, total, Number(page), Number(pageSize));
  }

  static async get(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const api = await prisma.api.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            database: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    return successResponse(res, api);
  }

  static async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const updateData = req.body;

    const api = await prisma.api.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    if (updateData.sql) {
      const validation = SqlValidator.validateSql(updateData.sql, api.method !== 'GET');
      if (!validation.valid) {
        return errorResponse(res, validation.error!, 400);
      }

      await prisma.apiVersion.create({
        data: {
          apiId: id,
          version: api.version,
          sql: api.sql,
          config: {
            parameters: api.parameters,
            responseMapping: api.responseMapping,
            cacheEnabled: api.cacheEnabled,
            cacheTtl: api.cacheTtl,
          },
          createdBy: userId,
        },
      });
    }

    const updated = await prisma.api.update({
      where: { id },
      data: updateData,
    });

    await CacheService.deletePattern(`api:${id}:*`);

    await WebhookService.trigger('api.updated', { api: updated });

    return successResponse(res, updated, 'API updated successfully');
  }

  static async delete(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const api = await prisma.api.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    await prisma.api.delete({ where: { id } });

    await CacheService.deletePattern(`api:${id}:*`);

    await WebhookService.trigger('api.deleted', { api });

    return successResponse(res, null, 'API deleted successfully');
  }

  static async publish(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const api = await prisma.api.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    const updated = await prisma.api.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await WebhookService.trigger('api.published', { api: updated });

    return successResponse(res, updated, 'API published successfully');
  }

  static async unpublish(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const api = await prisma.api.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    const updated = await prisma.api.update({
      where: { id },
      data: {
        status: 'DRAFT',
      },
    });

    await CacheService.deletePattern(`api:${id}:*`);

    await WebhookService.trigger('api.unpublished', { api: updated });

    return successResponse(res, updated, 'API unpublished successfully');
  }

  static async getMetrics(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { days = 7 } = req.query;
    const { userId, role } = req.user!;

    const api = await prisma.api.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const metrics = await prisma.apiMetric.findMany({
      where: {
        apiId: id,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const totalLogs = await prisma.apiLog.count({
      where: {
        apiId: id,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const errorLogs = await prisma.apiLog.count({
      where: {
        apiId: id,
        createdAt: {
          gte: startDate,
        },
        statusCode: {
          gte: 400,
        },
      },
    });

    return successResponse(res, {
      metrics,
      summary: {
        totalRequests: totalLogs,
        totalErrors: errorLogs,
        errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0,
      },
    });
  }

  static async getLogs(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { page = 1, pageSize = 50, status } = req.query;
    const { userId, role } = req.user!;

    const api = await prisma.api.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!api) {
      return errorResponse(res, 'API not found', 404);
    }

    const where: any = { apiId: id };

    if (status === 'error') {
      where.statusCode = { gte: 400 };
    } else if (status === 'success') {
      where.statusCode = { lt: 400 };
    }

    const [total, logs] = await Promise.all([
      prisma.apiLog.count({ where }),
      prisma.apiLog.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginatedResponse(res, logs, total, Number(page), Number(pageSize));
  }
}
