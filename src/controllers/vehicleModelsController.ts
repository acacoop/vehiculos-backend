import { BaseController } from "./baseController";
import { VehicleModelService } from "../services/vehicleModelService";
import type { VehicleModelInput } from "../schemas/vehicleModel";
import { RepositoryFindOptions } from "../repositories/interfaces/common";
import { VehicleModelFilters } from "../repositories/interfaces/IVehicleModelRepository";

export class VehicleModelsController extends BaseController<VehicleModelFilters> {
  constructor(private readonly service: VehicleModelService) {
    super({
      resourceName: "VehicleModel",
      allowedFilters: ["name", "brandId"],
      usePermissionFilter: false,
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<VehicleModelFilters>>,
  ) {
    return this.service.getAll(options);
  }
  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }
  protected async createService(data: unknown) {
    return this.service.create(data as VehicleModelInput);
  }
  protected async updateService(id: string, data: Partial<VehicleModelInput>) {
    return this.service.update(id, data);
  }
  protected async deleteService(id: string) {
    return this.service.delete(id);
  }
}

// Factory function is no longer needed here - will be created in routes
// Controllers should receive their dependencies
