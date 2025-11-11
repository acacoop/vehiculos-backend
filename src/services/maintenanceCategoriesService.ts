import { MaintenanceCategory as MaintenanceCategoryEntity } from "@/entities/MaintenanceCategory";
import {
  IMaintenanceCategoryRepository,
  MaintenanceCategoryFilters,
} from "@/repositories/interfaces/IMaintenanceCategoryRepository";
import type { MaintenanceCategory } from "@/schemas/maintenanceCategory";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

function map(e: MaintenanceCategoryEntity): MaintenanceCategory {
  return { id: e.id, name: e.name };
}

export class MaintenanceCategoriesService {
  constructor(private readonly repo: IMaintenanceCategoryRepository) {}
  async getAll(
    options?: RepositoryFindOptions<MaintenanceCategoryFilters>,
  ): Promise<{ items: MaintenanceCategory[]; total: number }> {
    const [entities, total] = await this.repo.findAndCount(options);
    return { items: entities.map(map), total };
  }
  async getById(id: string): Promise<MaintenanceCategory | null> {
    const found = await this.repo.findOne(id);
    return found ? map(found) : null;
  }
  async create(
    data: Omit<MaintenanceCategory, "id">,
  ): Promise<MaintenanceCategory | null> {
    const created = this.repo.create({ name: data.name });
    const saved = await this.repo.save(created as MaintenanceCategoryEntity);
    return map(saved);
  }
  async update(
    id: string,
    patch: Partial<MaintenanceCategory>,
  ): Promise<MaintenanceCategory | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (patch.name !== undefined) existing.name = patch.name;
    const saved = await this.repo.save(existing);
    return map(saved);
  }
  async delete(id: string): Promise<boolean> {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}
