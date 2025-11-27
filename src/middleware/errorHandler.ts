import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { errorResponse } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.stack, err.code);
  }

  return errorResponse(res, 'Internal server error', 500, err.message);
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
};
