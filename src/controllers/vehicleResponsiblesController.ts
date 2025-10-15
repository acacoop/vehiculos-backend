import { BaseController } from "./baseController";
import type { VehicleResponsibleInput } from "../schemas/vehicleResponsible";
import { AppError } from "../middleware/errorHandler";
import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { VehicleResponsiblesService } from "../services/vehicleResponsiblesService";
import { ServiceFactory } from "../factories/serviceFactory";
import { AppDataSource } from "../db";
import { PermissionFilterRequest } from "../middleware/permissionFilter";
import { RepositoryFindOptions } from "../repositories/interfaces/common";
import { VehicleResponsibleSearchParams } from "../repositories/interfaces/IVehicleResponsibleRepository";
import { parsePaginationQuery } from "../utils/common";

export class VehicleResponsiblesController extends BaseController {
  constructor(private readonly service: VehicleResponsiblesService) {
    super("Vehicle Responsible");
  }

  // Override getAll to use permission filter from middleware
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const permReq = req as PermissionFilterRequest;
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract search parameters (excluding pagination params)
    const searchParams: VehicleResponsibleSearchParams = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== "page" && key !== "limit" && typeof value === "string") {
        searchParams[key as keyof VehicleResponsibleSearchParams] = value;
      }
    }

    const options: RepositoryFindOptions<VehicleResponsibleSearchParams> = {
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
    const responsibleData = data as VehicleResponsibleInput;
    return await this.service.create(responsibleData);
  }

  protected async updateService(id: string, data: unknown) {
    const responsibleData = data as Partial<VehicleResponsibleInput>;
    return await this.service.update(id, responsibleData);
  }

  protected async patchService(id: string, data: unknown) {
    const responsibleData = data as Partial<VehicleResponsibleInput>;
    return await this.service.update(id, responsibleData);
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }

  // Custom endpoints
  public getCurrentForVehicle = asyncHandler(
    async (req: Request, res: Response) => {
      const vehicleId = req.params.vehicleId;

      if (!this.isValidUUID(vehicleId)) {
        throw new AppError(
          `Invalid UUID format provided: ${vehicleId}`,
          400,
          "https://example.com/problems/invalid-uuid",
          "Invalid UUID Format",
        );
      }

      const responsible = await this.service.getCurrentForVehicle(vehicleId);

      if (!responsible) {
        throw new AppError(
          `No current responsible found for vehicle ID ${vehicleId}`,
          404,
          "https://example.com/problems/resource-not-found",
          "Resource Not Found",
        );
      }

      this.sendResponse(res, responsible);
    },
  );

  public getCurrentVehiclesForUser = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.params.userId;

      if (!this.isValidUUID(userId)) {
        throw new AppError(
          `Invalid UUID format provided: ${userId}`,
          400,
          "https://example.com/problems/invalid-uuid",
          "Invalid UUID Format",
        );
      }

      const vehicles = await this.service.getCurrentForUser(userId);

      this.sendResponse(res, vehicles);
    },
  );
}

export const createVehicleResponsiblesController = (
  service?: VehicleResponsiblesService,
) => {
  const svc =
    service ??
    new ServiceFactory(AppDataSource).createVehicleResponsiblesService();
  return new VehicleResponsiblesController(svc);
};
