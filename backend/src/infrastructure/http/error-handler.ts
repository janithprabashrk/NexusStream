import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response format.
 */
interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Application error with additional context.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      status: 'error',
      message: err.message,
      code: err.code,
      details: err.details,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid JSON in request body',
    });
    return;
  }

  // Default 500 error
  const response: ErrorResponse = {
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  };
  res.status(500).json(response);
}

/**
 * Not found handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.path}`,
  });
}
