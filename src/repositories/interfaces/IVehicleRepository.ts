import { Vehicle } from "@/entities/Vehicle";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

/**
 * Vehicle-specific filter parameters
 */
export interface VehicleFilters {
  licensePlate?: string;
  brandId?: string;
  modelId?: string;
  year?: string;
  minYear?: string;
  maxYear?: string;
  fuelType?: string;
  minKilometers?: string;
  maxKilometers?: string;
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
