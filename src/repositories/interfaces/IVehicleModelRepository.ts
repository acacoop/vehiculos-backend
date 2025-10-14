import { VehicleModel } from "../../entities/VehicleModel";
import { DeleteResult } from "typeorm";

export interface VehicleModelSearchParams {
  name?: string;
  brandId?: string;
}

export interface VehicleModelFindOptions {
  limit?: number;
  offset?: number;
  searchParams?: VehicleModelSearchParams;
}

/**
 * Interface for VehicleModel Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IVehicleModelRepository {
  findAndCount(
    options?: VehicleModelFindOptions,
  ): Promise<[VehicleModel[], number]>;
  findOne(id: string): Promise<VehicleModel | null>;
  create(data: Partial<VehicleModel>): VehicleModel;
  save(entity: VehicleModel): Promise<VehicleModel>;
  delete(id: string): Promise<DeleteResult>;
}
