import { MaintenanceCategory } from "entities/MaintenanceCategory";
import { DeleteResult } from "typeorm";

export interface IMaintenanceCategoryRepository {
  findAll(): Promise<MaintenanceCategory[]>;
  findOne(id: string): Promise<MaintenanceCategory | null>;
  create(data: Partial<MaintenanceCategory>): MaintenanceCategory;
  save(entity: MaintenanceCategory): Promise<MaintenanceCategory>;
  delete(id: string): Promise<DeleteResult>;
}
