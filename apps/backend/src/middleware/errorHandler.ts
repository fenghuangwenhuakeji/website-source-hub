import { Request, Response, NextFunction } from 'express';
import dayjs from 'dayjs';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'APP_ERROR';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.path} was not found`,
    code: 'NOT_FOUND',
  });
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'API_ERROR';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code || 'BAD_REQUEST');
  }

  static unauthorized(message = 'Unauthorized', code?: string): ApiError {
    return new ApiError(401, message, code || 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden', code?: string): ApiError {
    return new ApiError(403, message, code || 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found', code?: string): ApiError {
    return new ApiError(404, message, code || 'NOT_FOUND');
  }

  static internal(message = 'Internal server error', code?: string): ApiError {
    return new ApiError(500, message, code || 'INTERNAL_ERROR');
  }
}
