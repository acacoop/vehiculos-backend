import { BaseController } from "./baseController";
import type { VehicleInput, VehicleUpdate } from "../schemas/vehicle";
import VehiclesService from "../services/vehicles/vehiclesService";

export class VehiclesController extends BaseController {
  constructor(private readonly service: VehiclesService) {
    super("Vehicle");
  }

  // Implement abstract methods from BaseController
  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    return await this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return await this.service.getById(id);
  }

  protected async createService(data: unknown) {
    return await this.service.create(data as VehicleInput);
  }

  protected async updateService(id: string, data: VehicleUpdate) {
    return await this.service.update(id, data);
  }

  protected async patchService(id: string, data: VehicleUpdate) {
    return await this.service.update(id, data);
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }
}
// Factory helper so each route file can create its isolated instance if desired
export const createVehiclesController = () =>
  new VehiclesController(new VehiclesService());
