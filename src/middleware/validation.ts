import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import { isValidUUID } from "../utils/uuidValidators";

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

/**
 * Middleware to validate UUID format in request parameters (expects :id param)
 */
export const validateId = (req: Request, res: Response, next: NextFunction): void => {
  validateUUIDFormat(req.params.id, "id");
  next();
};

/**
 * Middleware to validate maintenance category data
 */
export const validateMaintenanceCategoryData = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;
  
  // Validate name is provided and is a non-empty string
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Name is required and must be a non-empty string', 400);
  }
  
  // Validate name length
  if (name.length > 255) {
    throw new AppError('Name must be less than 255 characters', 400);
  }
  
  // Trim whitespace
  req.body.name = name.trim();
  
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
