import { BaseController } from "./baseController";
import type { VehicleResponsibleInput } from "schemas/vehicleResponsible";
import { AppError } from "middleware/errorHandler";
import { Request, Response } from "express";
import { asyncHandler } from "middleware/errorHandler";
import { VehicleResponsiblesService } from "services/vehicleResponsiblesService";
import { ServiceFactory } from "factories/serviceFactory";
import { AppDataSource } from "db";
import { RepositoryFindOptions } from "repositories/interfaces/common";
import { VehicleResponsibleFilters } from "repositories/interfaces/IVehicleResponsibleRepository";
import { isValidUUID } from "utils";

export class VehicleResponsiblesController extends BaseController<VehicleResponsibleFilters> {
  constructor(private readonly service: VehicleResponsiblesService) {
    super({
      resourceName: "VehicleResponsible",
      allowedFilters: ["vehicleId", "userId", "active", "date"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<VehicleResponsibleFilters>>,
  ) {
    return this.service.getAll(options);
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

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }

  // Custom endpoints
  public getCurrentForVehicle = asyncHandler(
    async (req: Request, res: Response) => {
      const vehicleId = req.params.vehicleId;

      if (!isValidUUID(vehicleId)) {
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

      if (!isValidUUID(userId)) {
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
