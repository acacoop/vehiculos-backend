import { Vehicle } from "../../entities/Vehicle";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "./common";

/**
 * Vehicle-specific filter parameters
 */
export interface VehicleFilters {
  licensePlate?: string;
  brand?: string;
  model?: string;
  brandId?: string;
  modelId?: string;
  year?: string;
}

export interface IVehicleRepository {
  findAndCount(
    options?: RepositoryFindOptions<VehicleFilters>,
  ): Promise<[Vehicle[], number]>;
  findOne(id: string): Promise<Vehicle | null>;
  findByIds(ids: string[]): Promise<Vehicle[]>;
  create(data: Partial<Vehicle>): Vehicle;
  save(vehicle: Vehicle): Promise<Vehicle>;
  delete(id: string): Promise<DeleteResult>;
  findWithDetails(id: string): Promise<Vehicle | null>;
}
