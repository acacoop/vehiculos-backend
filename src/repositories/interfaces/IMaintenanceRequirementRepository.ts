import { MaintenanceRequirement } from "@/entities/MaintenanceRequirement";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

/**
 * MaintenanceRequirement-specific filter parameters
 */
export interface MaintenanceRequirementFilters {
  vehicleId?: string;
  maintenanceId?: string;
  activeAt?: string; // ISO date string to filter active requirements at a specific date
}

export interface IMaintenanceRequirementRepository {
  findByMaintenance(maintenanceId: string): Promise<MaintenanceRequirement[]>;
  findByVehicle(vehicleId: string): Promise<MaintenanceRequirement[]>;
  findAndCount(
    options?: RepositoryFindOptions<MaintenanceRequirementFilters>,
  ): Promise<[MaintenanceRequirement[], number]>;
  findOne(id: string): Promise<MaintenanceRequirement | null>;
  /**
   * Finds overlapping requirements for a specific vehicle and maintenance
   * excluding a specific requirement ID (useful for updates)
   */
  findOverlapping(
    vehicleId: string,
    maintenanceId: string,
    startDate: string,
    endDate: string | null,
    excludeId?: string,
  ): Promise<MaintenanceRequirement[]>;
  create(data: Partial<MaintenanceRequirement>): MaintenanceRequirement;
  save(entity: MaintenanceRequirement): Promise<MaintenanceRequirement>;
  delete(id: string): Promise<DeleteResult>;
}
