import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { encrypt, decrypt } from '../utils/crypto';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { ConnectionManager, DatabaseType } from '../services/database/ConnectorFactory';
import { CacheService } from '../services/CacheService';

export class DataSourceController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    const { name, type, host, port, database, username, password, ssl, sslConfig, options, description } = req.body;
    const { userId } = req.user!;

    const encryptedPassword = encrypt(password);

    const dataSource = await prisma.dataSource.create({
      data: {
        name,
        type,
        host,
        port,
        database,
        username,
        password: encryptedPassword,
        ssl: ssl || false,
        sslConfig,
        options,
        description,
        createdBy: userId,
      },
    });

    const { password: _, ...dataSourceWithoutPassword } = dataSource;

    return successResponse(res, dataSourceWithoutPassword, 'Data source created successfully', 201);
  }

  static async list(req: AuthRequest, res: Response): Promise<Response> {
    const { page = 1, pageSize = 20, search } = req.query;
    const { userId, role } = req.user!;

    const where: any = role === 'ADMIN' ? {} : { createdBy: userId };

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { database: { contains: search as string } },
      ];
    }

    const [total, dataSources] = await Promise.all([
      prisma.dataSource.count({ where }),
      prisma.dataSource.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        select: {
          id: true,
          name: true,
          type: true,
          host: true,
          port: true,
          database: true,
          username: true,
          status: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          lastTestedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginatedResponse(res, dataSources, total, Number(page), Number(pageSize));
  }

  static async get(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
      select: {
        id: true,
        name: true,
        type: true,
        host: true,
        port: true,
        database: true,
        username: true,
        ssl: true,
        sslConfig: true,
        options: true,
        status: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        lastTestedAt: true,
      },
    });

    if (!dataSource) {
      return errorResponse(res, 'Data source not found', 404);
    }

    return successResponse(res, dataSource);
  }

  static async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const { name, host, port, database, username, password, ssl, sslConfig, options, description, status } = req.body;

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!dataSource) {
      return errorResponse(res, 'Data source not found', 404);
    }

    const updateData: any = {
      name,
      host,
      port,
      database,
      username,
      ssl,
      sslConfig,
      options,
      description,
      status,
    };

    if (password) {
      updateData.password = encrypt(password);
    }

    const updated = await prisma.dataSource.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        host: true,
        port: true,
        database: true,
        username: true,
        status: true,
        description: true,
        updatedAt: true,
      },
    });

    await CacheService.deletePattern(`datasource:${id}:*`);

    return successResponse(res, updated, 'Data source updated successfully');
  }

  static async delete(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!dataSource) {
      return errorResponse(res, 'Data source not found', 404);
    }

    await ConnectionManager.closeConnection(id);

    await prisma.dataSource.delete({ where: { id } });

    await CacheService.deletePattern(`datasource:${id}:*`);

    return successResponse(res, null, 'Data source deleted successfully');
  }

  static async test(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!dataSource) {
      return errorResponse(res, 'Data source not found', 404);
    }

    try {
      const connector = await ConnectionManager.getConnection(
        dataSource.id,
        dataSource.type as DatabaseType,
        {
          host: dataSource.host,
          port: dataSource.port,
          database: dataSource.database,
          username: dataSource.username,
          password: decrypt(dataSource.password),
          ssl: dataSource.ssl,
          sslConfig: dataSource.sslConfig,
          options: dataSource.options,
        }
      );

      const isConnected = await connector.testConnection();

      await prisma.dataSource.update({
        where: { id },
        data: {
          status: isConnected ? 'ACTIVE' : 'ERROR',
          lastTestedAt: new Date(),
        },
      });

      return successResponse(res, { connected: isConnected });
    } catch (error: any) {
      await prisma.dataSource.update({
        where: { id },
        data: { status: 'ERROR', lastTestedAt: new Date() },
      });

      return errorResponse(res, 'Connection test failed', 500, error.message);
    }
  }

  static async getTables(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!dataSource) {
      return errorResponse(res, 'Data source not found', 404);
    }

    try {
      const connector = await ConnectionManager.getConnection(
        dataSource.id,
        dataSource.type as DatabaseType,
        {
          host: dataSource.host,
          port: dataSource.port,
          database: dataSource.database,
          username: dataSource.username,
          password: decrypt(dataSource.password),
          ssl: dataSource.ssl,
          sslConfig: dataSource.sslConfig,
          options: dataSource.options,
        }
      );

      const tables = await connector.getTables();

      return successResponse(res, tables);
    } catch (error: any) {
      return errorResponse(res, 'Failed to get tables', 500, error.message);
    }
  }

  static async getTableSchema(req: AuthRequest, res: Response): Promise<Response> {
    const { id, tableName } = req.params;
    const { userId, role } = req.user!;

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!dataSource) {
      return errorResponse(res, 'Data source not found', 404);
    }

    try {
      const connector = await ConnectionManager.getConnection(
        dataSource.id,
        dataSource.type as DatabaseType,
        {
          host: dataSource.host,
          port: dataSource.port,
          database: dataSource.database,
          username: dataSource.username,
          password: decrypt(dataSource.password),
          ssl: dataSource.ssl,
          sslConfig: dataSource.sslConfig,
          options: dataSource.options,
        }
      );

      const schema = await connector.getTableSchema(tableName);

      return successResponse(res, schema);
    } catch (error: any) {
      return errorResponse(res, 'Failed to get table schema', 500, error.message);
    }
  }

  static async executeQuery(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { sql, parameters } = req.body;
    const { userId, role } = req.user!;

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        ...(role !== 'ADMIN' && { createdBy: userId }),
      },
    });

    if (!dataSource) {
      return errorResponse(res, 'Data source not found', 404);
    }

    const startTime = Date.now();

    try {
      const connector = await ConnectionManager.getConnection(
        dataSource.id,
        dataSource.type as DatabaseType,
        {
          host: dataSource.host,
          port: dataSource.port,
          database: dataSource.database,
          username: dataSource.username,
          password: decrypt(dataSource.password),
          ssl: dataSource.ssl,
          sslConfig: dataSource.sslConfig,
          options: dataSource.options,
        }
      );

      const result = await connector.execute(sql, parameters);
      const executionTime = Date.now() - startTime;

      await prisma.sqlHistory.create({
        data: {
          dataSourceId: id,
          sql,
          parameters,
          executionTime,
          rowsAffected: result.affectedRows || result.rowCount,
          status: 'SUCCESS',
          createdBy: userId,
        },
      });

      return successResponse(res, {
        ...result,
        executionTime,
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      await prisma.sqlHistory.create({
        data: {
          dataSourceId: id,
          sql,
          parameters,
          executionTime,
          status: 'FAILED',
          errorMessage: error.message,
          createdBy: userId,
        },
      });

      return errorResponse(res, 'Query execution failed', 500, error.message);
    }
  }
}
