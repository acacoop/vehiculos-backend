import { BaseController } from "./baseController";
import { VehicleBrandService } from "services/vehicleBrandsService";
import type { VehicleBrandInput } from "schemas/vehicleBrand";
import { RepositoryFindOptions } from "repositories/interfaces/common";
import { VehicleBrandFilters } from "repositories/interfaces/IVehicleBrandRepository";

export class VehicleBrandsController extends BaseController<VehicleBrandFilters> {
  constructor(private readonly service: VehicleBrandService) {
    super({
      resourceName: "VehicleBrand",
      allowedFilters: ["name"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<VehicleBrandFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    return this.service.create(data as VehicleBrandInput);
  }

  protected async updateService(id: string, data: Partial<VehicleBrandInput>) {
    return this.service.update(id, data);
  }

  protected async deleteService(id: string) {
    return this.service.delete(id);
  }
}

// Factory function is no longer needed here - will be created in routes
// Controllers should receive their dependencies
