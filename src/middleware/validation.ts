import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

/**
 * Internal function to validate UUID format
 */
const validateUUIDFormat = (id: string, paramName: string = "id"): void => {
  if (!id) {
    throw new AppError(`${paramName} parameter is required`, 400);
  }
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    throw new AppError(`Invalid UUID format for ${paramName}`, 400);
  }
};

/**
 * Middleware to validate UUID format in request parameters (expects :id param)
 */
export const validateId = (req: Request, res: Response, next: NextFunction): void => {
  validateUUIDFormat(req.params.id, "id");
  next();
};

/**
 * Middleware to validate UUID format for specific parameter names
 */
export const validateUUIDParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    validateUUIDFormat(req.params[paramName], paramName);
    next();
  };
};
