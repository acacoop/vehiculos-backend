import { MaintenanceRecord } from "../../entities/MaintenanceRecord";
import { SelectQueryBuilder } from "typeorm";

export interface MaintenanceRecordSearchParams {
  userId?: string;
  vehicleId?: string;
  maintenanceId?: string;
  assignedMaintenanceId?: string;
}

export interface MaintenanceRecordFindOptions {
  limit?: number;
  offset?: number;
  filters?: MaintenanceRecordSearchParams;
}

export interface IMaintenanceRecordRepository {
  qb(): SelectQueryBuilder<MaintenanceRecord>;
  findAndCount(
    options?: MaintenanceRecordFindOptions,
  ): Promise<[MaintenanceRecord[], number]>;
  findOne(id: string): Promise<MaintenanceRecord | null>;
  findByVehicle(vehicleId: string): Promise<MaintenanceRecord[]>;
  create(data: Partial<MaintenanceRecord>): MaintenanceRecord;
  save(entity: MaintenanceRecord): Promise<MaintenanceRecord>;
  findByAssignedMaintenance(
    assignedMaintenanceId: string,
  ): Promise<MaintenanceRecord[]>;
}
