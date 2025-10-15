import { VehicleKilometers } from "../../entities/VehicleKilometers";
import { SelectQueryBuilder } from "typeorm";

export interface IVehicleKilometersRepository {
  findByVehicle(vehicleId: string): Promise<VehicleKilometers[]>;
  qb(): SelectQueryBuilder<VehicleKilometers>;
  findPrev(vehicleId: string, date: Date): Promise<VehicleKilometers | null>;
  findNext(vehicleId: string, date: Date): Promise<VehicleKilometers | null>;
  create(data: Partial<VehicleKilometers>): VehicleKilometers;
  save(entity: VehicleKilometers): Promise<VehicleKilometers>;
}
