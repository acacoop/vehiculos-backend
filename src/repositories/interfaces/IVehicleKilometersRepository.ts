import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "./common";

export interface VehicleKilometersFilters {
  vehicleId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface IVehicleKilometersRepository {
  findAll(
    options: RepositoryFindOptions<Partial<VehicleKilometersFilters>>,
  ): Promise<{ items: VehicleKilometers[]; total: number }>;
  findById(id: string): Promise<VehicleKilometers | null>;
  findByVehicle(vehicleId: string): Promise<VehicleKilometers[]>;
  qb(): SelectQueryBuilder<VehicleKilometers>;
  findPrev(vehicleId: string, date: Date): Promise<VehicleKilometers | null>;
  findNext(vehicleId: string, date: Date): Promise<VehicleKilometers | null>;
  create(data: Partial<VehicleKilometers>): VehicleKilometers;
  save(entity: VehicleKilometers): Promise<VehicleKilometers>;
  delete(id: string): Promise<boolean>;
}
