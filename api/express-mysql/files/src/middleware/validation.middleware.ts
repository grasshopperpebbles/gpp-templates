import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from './error-handler.middleware.js';

/**
 * Validation middleware using Zod schemas
 * Validates request body, query, or params
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(data);
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated as any;
      } else {
        req.params = validated as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new ApiError(400, 'Validation failed. Please check your input.', {
          validation: validationErrors,
        });
      }
      next(error);
    }
  };
}

/**
 * Validate multiple sources at once
 */
export function validateMultiple(validators: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (validators.body) {
        req.body = validators.body.parse(req.body);
      }
      if (validators.query) {
        req.query = validators.query.parse(req.query) as any;
      }
      if (validators.params) {
        req.params = validators.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new ApiError(400, 'Validation failed. Please check your input.', {
          validation: validationErrors,
        });
      }
      next(error);
    }
  };
}
