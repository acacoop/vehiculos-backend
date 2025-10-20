import { BaseController } from "./baseController";
import { type MaintenanceCategory } from "schemas/maintenanceCategory";
import { MaintenanceCategoriesService } from "services/maintenanceCategoriesService";
import { RepositoryFindOptions } from "repositories/interfaces/common";

/**
 * MaintenanceCategoriesController - Manages maintenance categories
 * Uses simplified BaseController architecture
 */
export class MaintenanceCategoriesController extends BaseController {
  constructor(private readonly service: MaintenanceCategoriesService) {
    super({
      resourceName: "MaintenanceCategory",
      allowedFilters: [],
    });
  }

  // Implement abstract methods from BaseController
  protected async getAllService(
    _options: RepositoryFindOptions<Record<string, string>>,
  ) {
    // Maintenance categories don't typically need pagination, but we'll adapt the response
    const categories = await this.service.getAll();
    return { items: categories, total: categories.length };
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
