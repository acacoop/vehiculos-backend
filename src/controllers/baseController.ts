import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { isValidUUID } from '../utils/uuidValidators';

// Standard response format
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Base controller class with common CRUD operations
export abstract class BaseController {
  protected readonly resourceName: string;

  constructor(resourceName: string) {
    this.resourceName = resourceName;
  }

  // UUID validation helper
  protected isValidUUID(uuid: string): boolean {
    return isValidUUID(uuid);
  }
  // Standard success response with optional pagination
  protected sendResponse<T>(res: Response, data: T, message?: string, statusCode = 200, pagination?: ApiResponse['pagination']) {
    const response: ApiResponse<T> = {
      status: 'success',
      data,
      message,
      pagination,
    };
    res.status(statusCode).json(response);
  }

  // Standard error response
  protected sendError(res: Response, message: string, statusCode = 400) {
    const response: ApiResponse = {
      status: 'error',
      message,
    };
    res.status(statusCode).json(response);
  }

  // GET all resources with pagination and search
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Extract search parameters (excluding pagination params)
    const searchParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'page' && key !== 'limit' && typeof value === 'string') {
        searchParams[key] = value;
      }
    }

    const { items, total } = await this.getAllService({ limit, offset, searchParams });
    
    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  // GET by ID
  public getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    
    // Validate UUID format
    if (!this.isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        'https://example.com/problems/invalid-uuid',
        'Invalid UUID Format'
      );
    }
    
    const item = await this.getByIdService(id);
    
    if (!item) {
      throw new AppError(
        `${this.resourceName} with ID ${id} was not found`,
        404,
        'https://example.com/problems/resource-not-found',
        'Resource Not Found'
      );
    }
    
    this.sendResponse(res, item);
  });

  // POST create
  public create = asyncHandler(async (req: Request, res: Response) => {
    const item = await this.createService(req.body);
    this.sendResponse(res, item, 'Resource created successfully', 201);
  });

  // PUT update (full replacement)
  public update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    
    // Validate UUID format
    if (!this.isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        'https://example.com/problems/invalid-uuid',
        'Invalid UUID Format'
      );
    }
    
    const item = await this.updateService(id, req.body);
    
    if (!item) {
      throw new AppError(
        `${this.resourceName} with ID ${id} was not found`,
        404,
        'https://example.com/problems/resource-not-found',
        'Resource Not Found'
      );
    }
    
    this.sendResponse(res, item, 'Resource updated successfully');
  });

  // PATCH update (partial update)
  public patch = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    
    // Validate UUID format
    if (!this.isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        'https://example.com/problems/invalid-uuid',
        'Invalid UUID Format'
      );
    }
    
    const item = await this.patchService(id, req.body);
    
    if (!item) {
      throw new AppError(
        `${this.resourceName} with ID ${id} was not found`,
        404,
        'https://example.com/problems/resource-not-found',
        'Resource Not Found'
      );
    }
    
    this.sendResponse(res, item, 'Resource partially updated successfully');
  });

  // DELETE
  public delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    
    // Validate UUID format
    if (!this.isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        'https://example.com/problems/invalid-uuid',
        'Invalid UUID Format'
      );
    }
    
    const success = await this.deleteService(id);
    
    if (!success) {
      throw new AppError(
        `${this.resourceName} with ID ${id} was not found`,
        404,
        'https://example.com/problems/resource-not-found',
        'Resource Not Found'
      );
    }
    
    this.sendResponse(res, null, 'Resource deleted successfully', 204);
  });

  // Abstract methods to be implemented by child classes
  protected abstract getAllService(options: { limit: number; offset: number; searchParams?: Record<string, string> }): Promise<{ items: unknown[]; total: number }>;
  protected abstract getByIdService(id: string): Promise<unknown | null>;
  protected abstract createService(data: unknown): Promise<unknown>;
  protected abstract updateService(id: string, data: unknown): Promise<unknown | null>;
  protected abstract patchService(id: string, data: unknown): Promise<unknown | null>;
  protected abstract deleteService(id: string): Promise<boolean>;
}
