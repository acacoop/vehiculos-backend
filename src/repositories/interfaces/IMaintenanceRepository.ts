import { Maintenance } from "@/entities/Maintenance";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

/**
 * Maintenance-specific filter parameters
 */
export interface MaintenanceFilters {
  name?: string;
  categoryId?: string;
}

export interface IMaintenanceRepository {
  findAll(): Promise<Maintenance[]>;
  findAndCount(
    options?: RepositoryFindOptions<MaintenanceFilters>,
  ): Promise<[Maintenance[], number]>;
  findOne(id: string): Promise<Maintenance | null>;
  create(data: Partial<Maintenance>): Maintenance;
  save(entity: Maintenance): Promise<Maintenance>;
  delete(id: string): Promise<DeleteResult>;
}
