import { Request, Response } from "express";
import { BaseController } from "./baseController";
import { VehicleACLService } from "services/vehicleACLService";
import {
  VehicleACLCreateSchema,
  VehicleACLUpdateSchema,
} from "schemas/vehicleAcl";
import { asyncHandler } from "middleware/errorHandler";
import { parsePaginationQuery } from "utils";
import { VehicleACLFilters } from "repositories/VehicleACLRepository";
import { RepositoryFindOptions } from "repositories/interfaces/common";
import { extractFilters, extractSearch } from "utils";

/**
 * VehicleACLController - Manages vehicle access control lists
 * Uses simplified BaseController with special handling for Date filter
 */
export class VehicleACLController extends BaseController<VehicleACLFilters> {
  constructor(private readonly service: VehicleACLService) {
    super({
      resourceName: "VehicleACL",
      allowedFilters: ["userId", "vehicleId", "permission"],
    });
  }

  // Override getAll to handle activeAt Date conversion
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract search parameter
    const search = extractSearch(req.query);

    // Extract filters
    const filters = extractFilters<VehicleACLFilters>(req.query, [
      "userId",
      "vehicleId",
      "permission",
    ]);

    // Handle activeAt separately as it needs Date conversion
    if (req.query.activeAt && typeof req.query.activeAt === "string") {
      filters.activeAt = new Date(req.query.activeAt);
    }

    const options: RepositoryFindOptions<VehicleACLFilters> = {
      pagination: { limit, offset },
      filters,
      search,
    };

    const { items, total } = await this.service.getAll(options);

    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  protected async getAllService(
    options: RepositoryFindOptions<Partial<VehicleACLFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const validated = VehicleACLCreateSchema.parse(data);
    return this.service.create(validated);
  }

  protected async updateService(id: string, data: unknown) {
    const validated = VehicleACLUpdateSchema.parse(data);
    return this.service.update(id, validated);
  }

  protected async deleteService(id: string) {
    return this.service.delete(id);
  }

  // Custom endpoint: Get active ACLs for a user
  public getActiveForUser = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.params.userId;
      const at = req.query.at ? new Date(req.query.at as string) : undefined;

      const acls = await this.service.getActiveACLsForUser(userId, at);

      this.sendResponse(res, acls, "Active ACLs for user");
    },
  );
}
