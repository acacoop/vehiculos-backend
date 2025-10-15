import { Request, Response } from "express";
import { BaseController } from "./baseController";
import type { VehicleInput, VehicleUpdate } from "../schemas/vehicle";
import { VehiclesService } from "../services/vehiclesService";
import { ServiceFactory } from "../factories/serviceFactory";
import { AppDataSource } from "../db";
import { asyncHandler } from "../middleware/errorHandler";
import { PermissionFilterRequest } from "../middleware/permissionFilter";
import { RepositoryFindOptions } from "../repositories/interfaces/common";
import { VehicleSearchParams } from "../repositories/interfaces/IVehicleRepository";
import { parsePaginationQuery } from "../utils/common";

export class VehiclesController extends BaseController {
  constructor(private readonly service: VehiclesService) {
    super("Vehicle");
  }

  // Override getAll to use permission filter from middleware
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const permReq = req as PermissionFilterRequest;
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract search parameters (excluding pagination params)
    const searchParams: VehicleSearchParams = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== "page" && key !== "limit" && typeof value === "string") {
        searchParams[key as keyof VehicleSearchParams] = value;
      }
    }

    const options: RepositoryFindOptions<VehicleSearchParams> = {
      pagination: { limit, offset },
      searchParams,
      permissions: permReq.permissionFilter, // Populated by middleware
    };

    const { items, total } = await this.service.getAll(options);

    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  // Implement abstract methods from BaseController
  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    // This method is overridden by getAll() above
    // Kept for BaseController compatibility
    const { items, total } = await this.service.getAll({
      pagination: { limit: options.limit, offset: options.offset },
      searchParams: options.searchParams,
    });
    return { items, total };
  }

  protected async getByIdService(id: string) {
    return await this.service.getById(id);
  }

  protected async createService(data: unknown) {
    return await this.service.create(data as VehicleInput);
  }

  protected async updateService(id: string, data: VehicleUpdate) {
    return await this.service.update(id, data);
  }

  protected async patchService(id: string, data: VehicleUpdate) {
    return await this.service.update(id, data);
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }
}
// Factory helper so each route file can create its isolated instance if desired
export const createVehiclesController = () => {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const vehiclesService = serviceFactory.createVehiclesService();
  return new VehiclesController(vehiclesService);
};
