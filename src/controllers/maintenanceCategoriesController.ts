import { BaseController } from "@/controllers/baseController";
import { type MaintenanceCategory } from "@/schemas/maintenanceCategory";
import { MaintenanceCategoriesService } from "@/services/maintenanceCategoriesService";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceCategoryFilters } from "@/repositories/interfaces/IMaintenanceCategoryRepository";

/**
 * MaintenanceCategoriesController - Manages maintenance categories
 * Uses simplified BaseController architecture
 */
export class MaintenanceCategoriesController extends BaseController<MaintenanceCategoryFilters> {
  constructor(private readonly service: MaintenanceCategoriesService) {
    super({
      resourceName: "MaintenanceCategory",
      allowedFilters: ["name"],
    });
  }

  // Implement abstract methods from BaseController
  protected async getAllService(
    options: RepositoryFindOptions<Partial<MaintenanceCategoryFilters>>,
  ) {
    // Now maintenance categories support pagination and search
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return await this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const categoryData = data as Omit<MaintenanceCategory, "id">;
    return await this.service.create(categoryData);
  }

  protected async updateService(id: string, data: unknown) {
    const categoryData = data as Partial<MaintenanceCategory>;
    return await this.service.update(id, categoryData);
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }
}
