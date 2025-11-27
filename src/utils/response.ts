import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp: number;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: Date.now(),
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string,
  code?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    code,
    timestamp: Date.now(),
  };
  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'Success'
): Response => {
  const response = {
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    message,
    timestamp: Date.now(),
  };
  return res.status(200).json(response);
};
