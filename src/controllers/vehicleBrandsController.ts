import { BaseController } from "./baseController";
import { VehicleBrandService } from "../services/vehicleBrandService";
import type { VehicleBrandInput } from "../schemas/vehicleBrand";

export class VehicleBrandsController extends BaseController {
  constructor(private readonly service: VehicleBrandService) {
    super("VehicleBrand");
  }
  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
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
  protected async patchService(id: string, data: Partial<VehicleBrandInput>) {
    return this.service.update(id, data);
  }
  protected async deleteService(id: string) {
    return this.service.delete(id);
  }
}

// Factory function is no longer needed here - will be created in routes
// Controllers should receive their dependencies
