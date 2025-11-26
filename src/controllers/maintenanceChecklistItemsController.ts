import { BaseController } from "@/controllers/baseController";
import { AppError } from "@/middleware/errorHandler";
import { MaintenanceChecklistItemSchema } from "@/schemas/maintenanceChecklistItem";
import { MaintenanceChecklistItemsService } from "@/services/maintenanceChecklistItemsService";
import type { MaintenanceChecklistItem } from "@/schemas/maintenanceChecklistItem";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceChecklistItemFilters } from "@/repositories/interfaces/IMaintenanceChecklistItemRepository";

export class MaintenanceChecklistItemsController extends BaseController<MaintenanceChecklistItemFilters> {
  constructor(private readonly service: MaintenanceChecklistItemsService) {
    super({
      resourceName: "MaintenanceChecklistItem",
      allowedFilters: ["maintenanceChecklistId", "status"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<MaintenanceChecklistItemFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const maintenanceChecklistItem = MaintenanceChecklistItemSchema.parse(data);
    try {
      return await this.service.create(
        maintenanceChecklistItem as MaintenanceChecklistItem,
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
    const parsed = MaintenanceChecklistItemSchema.partial().parse(data);
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

export function createMaintenanceChecklistItemsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createMaintenanceChecklistItemsService();
  return new MaintenanceChecklistItemsController(service);
}

export const maintenanceChecklistItemsController =
  createMaintenanceChecklistItemsController();
