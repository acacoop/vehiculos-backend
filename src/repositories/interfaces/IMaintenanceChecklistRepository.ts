import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";
import { SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export interface MaintenanceChecklistFilters {
  vehicleId?: string;
  year?: number;
  quarter?: number;
  filledBy?: string;
  hasFailedItems?: boolean;
}

export interface IMaintenanceChecklistRepository {
  qb(): SelectQueryBuilder<MaintenanceChecklist>;
  findAndCount(
    options?: RepositoryFindOptions<MaintenanceChecklistFilters>,
  ): Promise<[MaintenanceChecklist[], number]>;
  findOne(id: string): Promise<MaintenanceChecklist | null>;
  create(data: Partial<MaintenanceChecklist>): MaintenanceChecklist;
  save(entity: MaintenanceChecklist): Promise<MaintenanceChecklist>;
  delete(id: string): Promise<boolean>;
}
