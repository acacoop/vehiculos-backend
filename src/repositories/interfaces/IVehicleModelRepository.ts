import { VehicleModel } from "entities/VehicleModel";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "./common";

export interface VehicleModelFilters {
  name?: string;
  brandId?: string;
}

/**
 * Interface for VehicleModel Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IVehicleModelRepository {
  findAndCount(
    options?: RepositoryFindOptions<VehicleModelFilters>,
  ): Promise<[VehicleModel[], number]>;
  findOne(id: string): Promise<VehicleModel | null>;
  create(data: Partial<VehicleModel>): VehicleModel;
  save(entity: VehicleModel): Promise<VehicleModel>;
  delete(id: string): Promise<DeleteResult>;
}
