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

/**
 * Middleware to validate assignment update data
 */
export const validateAssignmentUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, vehicleId, startDate, endDate } = req.body;
  
  // Validate UUIDs if provided
  if (userId && typeof userId === 'string') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new AppError('Invalid UUID format for userId', 400);
    }
  }
  
  if (vehicleId && typeof vehicleId === 'string') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vehicleId)) {
      throw new AppError('Invalid UUID format for vehicleId', 400);
    }
  }
  
  // Validate date formats if provided
  if (startDate && typeof startDate === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoDateRegex.test(startDate) || isNaN(new Date(startDate).getTime())) {
      throw new AppError('Invalid ISO date format for startDate', 400);
    }
  }
  
  if (endDate && typeof endDate === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoDateRegex.test(endDate) || isNaN(new Date(endDate).getTime())) {
      throw new AppError('Invalid ISO date format for endDate', 400);
    }
  }
  
  // Validate date logic if both dates are provided
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    throw new AppError('End date must be after start date', 400);
  }
  
  next();
};

/**
 * Middleware to validate assignment finish data
 */
export const validateAssignmentFinish = (req: Request, res: Response, next: NextFunction): void => {  
  const { endDate } = req.body;
  
  // Validate endDate format if provided
  if (endDate && typeof endDate === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoDateRegex.test(endDate) || isNaN(new Date(endDate).getTime())) {
      throw new AppError('Invalid ISO date format for endDate', 400);
    }
  }
  
  next();
};
