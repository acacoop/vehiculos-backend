import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// Regex patterns - defined once to avoid duplication
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

/**
 * Internal function to validate UUID format
 */
const validateUUIDFormat = (id: string, paramName: string = "id"): void => {
  if (!id) {
    throw new AppError(`${paramName} parameter is required`, 400);
  }
  
  if (!UUID_REGEX.test(id)) {
    throw new AppError(`Invalid UUID format for ${paramName}`, 400);
  }
};

/**
 * Internal function to validate ISO date format
 */
const validateISODateFormat = (dateString: string, paramName: string): void => {
  if (!ISO_DATE_REGEX.test(dateString) || isNaN(new Date(dateString).getTime())) {
    throw new AppError(`Invalid ISO date format for ${paramName}`, 400);
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
  
  // Validate UUIDs if provided using the unified function
  if (userId && typeof userId === 'string') {
    validateUUIDFormat(userId, 'userId');
  }
  
  if (vehicleId && typeof vehicleId === 'string') {
    validateUUIDFormat(vehicleId, 'vehicleId');
  }
  
  // Validate date formats if provided using the unified function
  if (startDate && typeof startDate === 'string') {
    validateISODateFormat(startDate, 'startDate');
  }
  
  if (endDate && typeof endDate === 'string') {
    validateISODateFormat(endDate, 'endDate');
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
  
  // Validate endDate format if provided using the unified function
  if (endDate && typeof endDate === 'string') {
    validateISODateFormat(endDate, 'endDate');
  }
  
  next();
};
