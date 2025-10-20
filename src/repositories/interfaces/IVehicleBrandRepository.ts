import { VehicleBrand } from "entities/VehicleBrand";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "./common";

export interface VehicleBrandFilters {
  name?: string;
}

/**
 * Interface for VehicleBrand Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IVehicleBrandRepository {
  findAndCount(
    options?: RepositoryFindOptions<VehicleBrandFilters>,
  ): Promise<[VehicleBrand[], number]>;
  findOne(id: string): Promise<VehicleBrand | null>;
  findOneByWhere(where: { id: string }): Promise<VehicleBrand | null>;
  create(data: Partial<VehicleBrand>): VehicleBrand;
  save(entity: VehicleBrand): Promise<VehicleBrand>;
  delete(id: string): Promise<DeleteResult>;
}
