import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return errorResponse(res, 'User not found or inactive', 401);
      }

      req.user = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      next();
    } catch (error) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 500);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

export const apiKeyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return errorResponse(res, 'API key required', 401);
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { select: { id: true, username: true, role: true, status: true } } },
    });

    if (!keyRecord || keyRecord.status !== 'ACTIVE') {
      return errorResponse(res, 'Invalid or inactive API key', 401);
    }

    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      return errorResponse(res, 'API key expired', 401);
    }

    if (keyRecord.user.status !== 'ACTIVE') {
      return errorResponse(res, 'User account inactive', 401);
    }

    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    req.user = {
      userId: keyRecord.user.id,
      username: keyRecord.user.username,
      role: keyRecord.user.role,
    };

    next();
  } catch (error) {
    return errorResponse(res, 'API key authentication failed', 500);
  }
};
