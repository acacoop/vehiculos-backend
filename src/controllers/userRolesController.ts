import { Request, Response } from "express";
import { BaseController } from "./baseController";
import { UserRolesService } from "../services/userRolesService";
import { asyncHandler } from "../middleware/errorHandler";
import {
  UserRoleInputSchema,
  UserRoleUpdateSchema,
  UserRoleEndSchema,
} from "../schemas/userRole";
import { parsePaginationQuery } from "../utils";
import { UserRoleFilters } from "../repositories/UserRoleRepository";
import { extractFilters, extractSearch } from "../utils";

/**
 * UserRolesController - Manages user roles
 * Uses simplified BaseController with special handling for boolean filter
 */
export class UserRolesController extends BaseController<UserRoleFilters> {
  constructor(private readonly service: UserRolesService) {
    super({
      resourceName: "UserRole",
      allowedFilters: ["userId", "role"],
      usePermissionFilter: false,
    });
  }

  // Override getAll to handle activeOnly boolean conversion
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract search parameter
    const search = extractSearch(req.query);

    // Extract filters
    const filters = extractFilters<UserRoleFilters>(req.query, [
      "userId",
      "role",
    ]);

    // Handle activeOnly separately as it needs boolean conversion
    if (req.query.activeOnly && typeof req.query.activeOnly === "string") {
      filters.activeOnly = req.query.activeOnly === "true";
    }

    const { items, total } = await this.service.getAll({
      limit,
      offset,
      filters,
      search,
    });

    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  protected async getAllService(options: {
    pagination: { limit: number; offset: number };
    filters?: Partial<UserRoleFilters>;
    search?: string;
  }) {
    return this.service.getAll({
      limit: options.pagination.limit,
      offset: options.pagination.offset,
      filters: options.filters,
      search: options.search,
    });
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const parsed = UserRoleInputSchema.parse(data);
    return this.service.create(parsed);
  }

  protected async updateService(id: string, data: unknown) {
    const parsed = UserRoleUpdateSchema.partial().parse(data);
    return this.service.update(id, parsed);
  }

  protected async deleteService(id: string) {
    return this.service.delete(id);
  }

  // Custom endpoints

  public getByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const data = await this.service.getByUserId(userId);
    this.sendResponse(res, data, "User roles retrieved successfully");
  });

  public getActiveByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const data = await this.service.getActiveByUserId(userId);
    this.sendResponse(res, data, "Active user role retrieved successfully");
  });

  public endRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const parsed = UserRoleEndSchema.parse(req.body);
    const data = await this.service.endRole(id, parsed.endTime);

    if (!data) {
      res.status(404).json({
        status: "error",
        message: "User role not found",
      });
      return;
    }

    this.sendResponse(res, data, "User role ended successfully");
  });
}
