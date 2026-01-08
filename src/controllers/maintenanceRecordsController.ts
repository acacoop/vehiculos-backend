import { BaseController } from "@/controllers/baseController";
import { AppError } from "@/middleware/errorHandler";
import {
  MaintenanceRecordSchema,
  MaintenanceRecordUpdateSchema,
} from "@/schemas/maintenanceRecord";
import { MaintenanceRecordsService } from "@/services/maintenancesService";
import type { MaintenanceRecord } from "@/schemas/maintenanceRecord";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceRecordFilters } from "@/repositories/interfaces/IMaintenanceRecordRepository";
import type { Request } from "express";
import type { AuthenticatedRequest } from "@/middleware/auth";

export class MaintenanceRecordsController extends BaseController<MaintenanceRecordFilters> {
  constructor(private readonly service: MaintenanceRecordsService) {
    super({
      resourceName: "MaintenanceRecord",
      allowedFilters: ["userId", "vehicleId", "maintenanceId"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<MaintenanceRecordFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const maintenanceRecord = MaintenanceRecordSchema.parse(data);
    try {
      return await this.service.create(maintenanceRecord as MaintenanceRecord);
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

  protected async updateService(
    id: string,
    data: unknown,
    req: Request,
  ): Promise<unknown | null> {
    const updateData = MaintenanceRecordUpdateSchema.parse(data);
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      throw new AppError(
        "User ID is required for updating maintenance records",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );
    }

    try {
      return await this.service.update(id, updateData, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
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

  protected async deleteService(id: string): Promise<boolean> {
    return await this.service.delete(id);
  }
}
export function createMaintenanceRecordsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createMaintenanceRecordsService();
  return new MaintenanceRecordsController(service);
}

export const maintenanceRecordsController =
  createMaintenanceRecordsController();
