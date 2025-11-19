import { BaseController } from "@/controllers/baseController";
import { AppError } from "@/middleware/errorHandler";
import { MaintenanceChecklistSchema } from "@/schemas/maintenanceChecklist";
import { MaintenanceChecklistsService } from "@/services/maintenanceChecklistsService";
import type { MaintenanceChecklist } from "@/schemas/maintenanceChecklist";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceChecklistFilters } from "@/repositories/interfaces/IMaintenanceChecklistRepository";

export class MaintenanceChecklistsController extends BaseController<MaintenanceChecklistFilters> {
  constructor(private readonly service: MaintenanceChecklistsService) {
    super({
      resourceName: "MaintenanceChecklist",
      allowedFilters: [
        "vehicleId",
        "year",
        "quarter",
        "filledBy",
        "hasFailedItems",
      ],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<MaintenanceChecklistFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const maintenanceChecklist = MaintenanceChecklistSchema.parse(data);
    try {
      return await this.service.create(
        maintenanceChecklist as MaintenanceChecklist,
      );
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

  protected async updateService(id: string, data: unknown) {
    const parsed = MaintenanceChecklistSchema.partial().parse(data);
    try {
      return await this.service.update(id, parsed);
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

  protected async deleteService(id: string): Promise<boolean> {
    return this.service.delete(id);
  }
}

export function createMaintenanceChecklistsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createMaintenanceChecklistsService();
  return new MaintenanceChecklistsController(service);
}

export const maintenanceChecklistsController =
  createMaintenanceChecklistsController();
