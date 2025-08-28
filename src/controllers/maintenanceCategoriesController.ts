import { BaseController } from './baseController';
import type { MaintenanceCategory } from '../types';
import { 
  getAllMaintenancesCategories, 
  getMaintenanceCategoryById, 
  createMaintenanceCategory, 
  updateMaintenanceCategory, 
  deleteMaintenanceCategory
} from '../services/vehicles/maintenance/categories';

export class MaintenanceCategoriesController extends BaseController {
  constructor() {
    super('Maintenance Category');
  }

  // Implement abstract methods from BaseController
  protected async getAllService(_options: { limit: number; offset: number; searchParams?: Record<string, string> }) {
    // Maintenance categories don't typically need pagination, but we'll adapt the response
    const categories = await getAllMaintenancesCategories();
    return { items: categories, total: categories.length };
  }

  protected async getByIdService(id: string) {
    return await getMaintenanceCategoryById(id);
  }

  protected async createService(data: unknown) {
    const categoryData = data as Omit<MaintenanceCategory, 'id'>;
    return await createMaintenanceCategory(categoryData);
  }

  protected async updateService(id: string, data: unknown) {
    const categoryData = data as Partial<MaintenanceCategory>;
    return await updateMaintenanceCategory(id, categoryData);
  }

  protected async patchService(id: string, data: unknown) {
    // For PATCH, use the same logic as update since both accept partial data
    const categoryData = data as Partial<MaintenanceCategory>;
    return await updateMaintenanceCategory(id, categoryData);
  }

  protected async deleteService(id: string) {
    return await deleteMaintenanceCategory(id);
  }
}

export const maintenanceCategoriesController = new MaintenanceCategoriesController();
