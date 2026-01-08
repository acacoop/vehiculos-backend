import { BaseController } from "@/controllers/baseController";
import {
  MaintenanceCreateSchema,
  MaintenanceUpdateSchema,
} from "@/schemas/maintenance";
import { MaintenancesService } from "@/services/maintenancesService";
import { AppError } from "@/middleware/errorHandler";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceFilters } from "@/repositories/interfaces/IMaintenanceRepository";
import type { Request } from "express";

/**
 * MaintenancePosiblesController - Manages possible maintenances
 * Uses simplified BaseController architecture
 */
export class MaintenancePosiblesController extends BaseController<MaintenanceFilters> {
  constructor(private readonly service: MaintenancesService) {
    super({
      resourceName: "Maintenance",
      allowedFilters: ["name", "categoryId"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<MaintenanceFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    const maintenance = await this.service.getWithDetails(id);
    if (!maintenance) {
      return null;
    }
    return maintenance;
  }

  protected async createService(data: unknown) {
    const maintenanceData = MaintenanceCreateSchema.parse(data);

    try {
      return await this.service.create(maintenanceData);
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(
          error.message,
          400,
          "https://example.com/problems/validation-error",
          "Validation Error",
        );
      }
      throw error;
    }
  }

  protected async updateService(id: string, data: unknown, _req: Request) {
    const maintenanceData = MaintenanceUpdateSchema.parse(data);

    try {
      return await this.service.update(id, maintenanceData);
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(
          error.message,
          400,
          "https://example.com/problems/validation-error",
          "Validation Error",
        );
      }
      throw error;
    }
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }
}

export const createMaintenancePosiblesController = (
  service?: MaintenancesService,
) => {
  const svc =
    service ?? new ServiceFactory(AppDataSource).createMaintenancesService();
  return new MaintenancePosiblesController(svc);
};

export const maintenancePosiblesController =
  createMaintenancePosiblesController();
