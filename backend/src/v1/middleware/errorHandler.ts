import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export interface CustomError extends Error {
  statusCode?: number;
}

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON responses
 */
export const errorHandler = (
  error: CustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`Error on ${req.method} ${req.path}:`, error);

  // Prisma database errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'A record with this information already exists',
          field: error.meta?.target
        });
      
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
          message: 'The requested resource was not found'
        });
      
      case 'P2003':
        return res.status(400).json({
          error: 'Foreign key constraint failed',
          message: 'Referenced record does not exist'
        });
      
      case 'P2021':
        return res.status(404).json({
          error: 'Table does not exist',
          message: 'Database table not found'
        });
      
      default:
        return res.status(400).json({
          error: 'Database error',
          message: 'An error occurred while processing your request',
          code: error.code
        });
    }
  }

  // JWT authentication errors
  if (error instanceof JsonWebTokenError) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided authentication token is invalid'
    });
  }

  if (error instanceof TokenExpiredError) {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Your authentication token has expired. Please login again.'
    });
  }

  // Joi validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'The provided data is invalid',
      details: error.message
    });
  }

  // Custom application errors with status codes
  if ('statusCode' in error && error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.name || 'Application Error',
      message: error.message
    });
  }

  // Network and timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return res.status(408).json({
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  }

  // Default server error for unhandled cases
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message
    })
  });
};