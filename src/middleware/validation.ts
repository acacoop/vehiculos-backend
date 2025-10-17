import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import { isValidUUID } from "../utils";
import type { ZodSchema } from "zod";

/**
 * Internal function to validate UUID format for middleware (throws AppError)
 */
const validateUUIDFormat = (id: string, paramName: string = "id"): void => {
  if (!id) {
    throw new AppError(`${paramName} parameter is required`, 400);
  }

  if (!isValidUUID(id)) {
    throw new AppError(`Invalid UUID format for ${paramName}`, 400);
  }
};

// Generic UUID param validator (defaults to 'id')
export const validateUUIDParam = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    validateUUIDFormat(req.params[paramName], paramName);
    next();
  };
};

/**
 * Middleware to validate maintenance category data
 */
// Generic body validator using Zod schemas
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Validate body shape; controllers can re-parse to get typed data if needed
      schema.parse(req.body);
      next();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid request body";
      throw new AppError(message, 400);
    }
  };
};
