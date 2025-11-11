import { MaintenanceCategory } from "@/entities/MaintenanceCategory";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

/**
 * MaintenanceCategory-specific filter parameters
 */
export interface MaintenanceCategoryFilters {
  name?: string;
}

export interface IMaintenanceCategoryRepository {
  findAll(): Promise<MaintenanceCategory[]>;
  findAndCount(
    options?: RepositoryFindOptions<MaintenanceCategoryFilters>,
  ): Promise<[MaintenanceCategory[], number]>;
  findOne(id: string): Promise<MaintenanceCategory | null>;
  create(data: Partial<MaintenanceCategory>): MaintenanceCategory;
  save(entity: MaintenanceCategory): Promise<MaintenanceCategory>;
  delete(id: string): Promise<DeleteResult>;
}
