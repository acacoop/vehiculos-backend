import { MaintenanceChecklistItem } from "@/entities/MaintenanceChecklistItem";
import { SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceChecklistItemStatus } from "@/enums/MaintenanceChecklistItemStatusEnum";

export interface MaintenanceChecklistItemFilters {
  maintenanceChecklistId?: string;
  status?: MaintenanceChecklistItemStatus;
}

export interface IMaintenanceChecklistItemRepository {
  qb(): SelectQueryBuilder<MaintenanceChecklistItem>;
  findAndCount(
    options?: RepositoryFindOptions<MaintenanceChecklistItemFilters>,
  ): Promise<[MaintenanceChecklistItem[], number]>;
  findOne(id: string): Promise<MaintenanceChecklistItem | null>;
  create(data: Partial<MaintenanceChecklistItem>): MaintenanceChecklistItem;
  save(entity: MaintenanceChecklistItem): Promise<MaintenanceChecklistItem>;
  delete(id: string): Promise<boolean>;
  createMany(
    data: Partial<MaintenanceChecklistItem>[],
  ): MaintenanceChecklistItem[];
  saveMany(
    entities: MaintenanceChecklistItem[],
  ): Promise<MaintenanceChecklistItem[]>;
}
