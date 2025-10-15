import { Request, Response } from "express";
import { BaseController } from "./baseController";
import { VehicleACLService } from "../services/vehicleACLService";
import {
  VehicleACLCreateSchema,
  VehicleACLUpdateSchema,
} from "../schemas/vehicleAcl";
import { asyncHandler } from "../middleware/errorHandler";
import { parsePaginationQuery } from "../utils/common";
import { VehicleACLSearchParams } from "../repositories/VehicleACLRepository";
import { RepositoryFindOptions } from "../repositories/interfaces/common";

export class VehicleACLController extends BaseController {
  constructor(private readonly service: VehicleACLService) {
    super("VehicleACL");
  }

  // Override getAll to support search params
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract search parameters
    const searchParams: VehicleACLSearchParams = {};
    if (req.query.userId) searchParams.userId = req.query.userId as string;
    if (req.query.vehicleId)
      searchParams.vehicleId = req.query.vehicleId as string;
    if (req.query.permission)
      searchParams.permission = req.query.permission as VehicleACLSearchParams["permission"];
    if (req.query.activeAt)
      searchParams.activeAt = new Date(req.query.activeAt as string);

    const options: RepositoryFindOptions<VehicleACLSearchParams> = {
      pagination: { limit, offset },
      searchParams,
    };

    const { items, total } = await this.service.getAll(options);

    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    return this.service.getAll({ pagination: options });
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

  protected async patchService(id: string, data: unknown) {
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
