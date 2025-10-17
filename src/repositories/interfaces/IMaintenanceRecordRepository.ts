import { MaintenanceRecord } from "../../entities/MaintenanceRecord";
import { SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "./common";

export interface MaintenanceRecordFilters {
  userId?: string;
  vehicleId?: string;
  maintenanceId?: string;
  assignedMaintenanceId?: string;
}

export interface IMaintenanceRecordRepository {
  qb(): SelectQueryBuilder<MaintenanceRecord>;
  findAndCount(
    options?: RepositoryFindOptions<MaintenanceRecordFilters>,
  ): Promise<[MaintenanceRecord[], number]>;
  findOne(id: string): Promise<MaintenanceRecord | null>;
  findByVehicle(vehicleId: string): Promise<MaintenanceRecord[]>;
  create(data: Partial<MaintenanceRecord>): MaintenanceRecord;
  save(entity: MaintenanceRecord): Promise<MaintenanceRecord>;
  findByAssignedMaintenance(
    assignedMaintenanceId: string,
  ): Promise<MaintenanceRecord[]>;
}
