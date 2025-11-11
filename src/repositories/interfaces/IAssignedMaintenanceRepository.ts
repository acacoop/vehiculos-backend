import { AssignedMaintenance } from "@/entities/AssignedMaintenance";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

/**
 * AssignedMaintenance-specific filter parameters
 */
export interface AssignedMaintenanceFilters {
  vehicleId?: string;
  maintenanceId?: string;
}

export interface IAssignedMaintenanceRepository {
  findByMaintenance(maintenanceId: string): Promise<AssignedMaintenance[]>;
  findByVehicle(vehicleId: string): Promise<AssignedMaintenance[]>;
  findAndCount(
    options?: RepositoryFindOptions<AssignedMaintenanceFilters>,
  ): Promise<[AssignedMaintenance[], number]>;
  findOne(id: string): Promise<AssignedMaintenance | null>;
  create(data: Partial<AssignedMaintenance>): AssignedMaintenance;
  save(entity: AssignedMaintenance): Promise<AssignedMaintenance>;
  delete(id: string): Promise<DeleteResult>;
}
