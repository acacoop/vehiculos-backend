import { BaseController } from "./baseController";
import { AppError } from "middleware/errorHandler";
import { MaintenanceRecordSchema } from "schemas/maintenanceRecord";
import { MaintenanceRecordsService } from "services/maintenancesService";
import type { MaintenanceRecord } from "schemas/maintenanceRecord";
import { ServiceFactory } from "factories/serviceFactory";
import { AppDataSource } from "db";
import { RepositoryFindOptions } from "repositories/interfaces/common";
import { MaintenanceRecordFilters } from "repositories/interfaces/IMaintenanceRecordRepository";

export class MaintenanceRecordsController extends BaseController<MaintenanceRecordFilters> {
  constructor(private readonly service: MaintenanceRecordsService) {
    super({
      resourceName: "MaintenanceRecord",
      allowedFilters: [
        "userId",
        "vehicleId",
        "maintenanceId",
        "assignedMaintenanceId",
      ],
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

  protected async updateService(): Promise<unknown | null> {
    throw new AppError(
      "Update not supported for maintenance records",
      405,
      "https://example.com/problems/method-not-allowed",
      "Method Not Allowed",
    );
  }

  protected async deleteService(): Promise<boolean> {
    throw new AppError(
      "Delete not supported for maintenance records",
      405,
      "https://example.com/problems/method-not-allowed",
      "Method Not Allowed",
    );
  }
}
export function createMaintenanceRecordsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createMaintenanceRecordsService();
  return new MaintenanceRecordsController(service);
}

export const maintenanceRecordsController =
  createMaintenanceRecordsController();
