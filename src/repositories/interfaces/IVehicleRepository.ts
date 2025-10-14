import { Vehicle } from "../../entities/Vehicle";
import { DeleteResult } from "typeorm";

export interface VehicleSearchParams {
  licensePlate?: string;
  brand?: string;
  model?: string;
  brandId?: string;
  modelId?: string;
  year?: string;
}

export interface VehicleFindOptions {
  limit?: number;
  offset?: number;
  searchParams?: VehicleSearchParams;
}

export interface IVehicleRepository {
  findAndCount(options?: VehicleFindOptions): Promise<[Vehicle[], number]>;
  findOne(id: string): Promise<Vehicle | null>;
  findByIds(ids: string[]): Promise<Vehicle[]>;
  create(data: Partial<Vehicle>): Vehicle;
  save(vehicle: Vehicle): Promise<Vehicle>;
  delete(id: string): Promise<DeleteResult>;
  findWithDetails(id: string): Promise<Vehicle | null>;
}
