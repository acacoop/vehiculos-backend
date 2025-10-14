import { BaseController } from "./baseController";
import {
  MaintenanceCategorySchema,
  type MaintenanceCategory,
} from "../schemas/maintenanceCategory";
import { MaintenanceCategoriesService } from "../services/maintenanceCategoriesService";

export class MaintenanceCategoriesController extends BaseController {
  constructor(private readonly service: MaintenanceCategoriesService) {
    super("Maintenance Category");
  }

  // Implement abstract methods from BaseController
  protected async getAllService(_options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
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

  protected async patchService(id: string, data: unknown) {
    // For PATCH, use the same logic as update since both accept partial data
    const categoryData = data as Partial<MaintenanceCategory>;
    return await this.service.update(id, categoryData);
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }
}
