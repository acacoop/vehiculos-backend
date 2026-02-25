import { BaseController } from "@/controllers/baseController";
import type { VehicleInput, VehicleUpdate } from "@/schemas/vehicle";
import { VehiclesService } from "@/services/vehiclesService";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { VehicleFilters } from "@/repositories/interfaces/IVehicleRepository";
import type { Request } from "express";

export class VehiclesController extends BaseController<VehicleFilters> {
  constructor(private readonly service: VehiclesService) {
    super({
      resourceName: "Vehicle",
      allowedFilters: [
        "licensePlate",
        "brandId",
        "modelId",
        "year",
        "minYear",
        "maxYear",
        "fuelType",
        "minKilometers",
        "maxKilometers",
        "registrationDateFrom",
        "registrationDateTo",
      ],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<VehicleFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return await this.service.getById(id);
  }

  protected async createService(data: unknown) {
    return await this.service.create(data as VehicleInput);
  }

  protected async updateService(
    id: string,
    data: VehicleUpdate,
    _req: Request,
  ) {
    return await this.service.update(id, data);
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }
}
// Factory helper so each route file can create its isolated instance if desired
export const createVehiclesController = () => {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const vehiclesService = serviceFactory.createVehiclesService();
  return new VehiclesController(vehiclesService);
};
