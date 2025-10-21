import { Request, Response } from "express";
import { asyncHandler, AppError } from "@/middleware/errorHandler";
import {
  isValidUUID,
  extractFilters,
  extractSearch,
  parsePaginationQuery,
} from "@/utils";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BaseControllerConfig<TFilters = Record<string, string>> {
  resourceName: string;
  allowedFilters?: (keyof TFilters)[];
}

export abstract class BaseController<TFilters = Record<string, string>> {
  protected readonly resourceName: string;
  protected readonly allowedFilters?: (keyof TFilters)[];

  constructor(config: BaseControllerConfig<TFilters>) {
    this.resourceName = config.resourceName;
    this.allowedFilters = config.allowedFilters;
  }

  protected sendResponse<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
    pagination?: ApiResponse["pagination"],
  ) {
    const response: ApiResponse<T> = {
      status: "success",
      data,
      message,
      pagination,
    };
    res.status(statusCode).json(response);
  }

  protected sendError(res: Response, message: string, statusCode = 400) {
    const response: ApiResponse = {
      status: "error",
      message,
    };
    res.status(statusCode).json(response);
  }

  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);

    const search = extractSearch(req.query);

    const filters = this.allowedFilters
      ? extractFilters<TFilters>(req.query, this.allowedFilters)
      : extractFilters<TFilters>(req.query);

    const options: RepositoryFindOptions<Partial<TFilters>> = {
      pagination: { limit, offset },
      filters,
      search,
    };

    const { items, total } = await this.getAllService(options);

    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        "https://example.com/problems/invalid-uuid",
        "Invalid UUID Format",
      );
    }

    const item = await this.getByIdService(id);

    if (!item) {
      throw new AppError(
        `${this.resourceName} with ID ${id} was not found`,
        404,
        "https://example.com/problems/resource-not-found",
        "Resource Not Found",
      );
    }

    this.sendResponse(res, item);
  });

  public create = asyncHandler(async (req: Request, res: Response) => {
    const item = await this.createService(req.body);
    this.sendResponse(res, item, "Resource created successfully", 201);
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        "https://example.com/problems/invalid-uuid",
        "Invalid UUID Format",
      );
    }

    const item = await this.updateService(id, req.body);

    if (!item) {
      throw new AppError(
        `${this.resourceName} with ID ${id} was not found`,
        404,
        "https://example.com/problems/resource-not-found",
        "Resource Not Found",
      );
    }

    this.sendResponse(res, item, "Resource updated successfully");
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        "https://example.com/problems/invalid-uuid",
        "Invalid UUID Format",
      );
    }

    const success = await this.deleteService(id);

    if (!success) {
      throw new AppError(
        `${this.resourceName} with ID ${id} was not found`,
        404,
        "https://example.com/problems/resource-not-found",
        "Resource Not Found",
      );
    }

    this.sendResponse(res, null, "Resource deleted successfully", 204);
  });

  protected abstract getAllService(
    options: RepositoryFindOptions<Partial<TFilters>>,
  ): Promise<{ items: unknown[]; total: number }>;

  protected abstract getByIdService(id: string): Promise<unknown | null>;
  protected abstract createService(data: unknown): Promise<unknown>;
  protected abstract updateService(
    id: string,
    data: unknown,
  ): Promise<unknown | null>;

  protected abstract deleteService(id: string): Promise<boolean>;
}
