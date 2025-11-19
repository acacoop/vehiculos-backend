import { DataSource, Repository } from "typeorm";
import { MaintenanceChecklistItem } from "@/entities/MaintenanceChecklistItem";
import {
  IMaintenanceChecklistItemRepository,
  MaintenanceChecklistItemFilters,
} from "@/repositories/interfaces/IMaintenanceChecklistItemRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class MaintenanceChecklistItemRepository
  implements IMaintenanceChecklistItemRepository
{
  private readonly repo: Repository<MaintenanceChecklistItem>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceChecklistItem);
  }
  qb() {
    return this.repo.createQueryBuilder("mci");
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceChecklistItemFilters>,
  ): Promise<[MaintenanceChecklistItem[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.qb()
      .leftJoinAndSelect("mci.maintenanceChecklist", "mc")
      .leftJoinAndSelect("mc.vehicle", "v")
      .leftJoinAndSelect("mc.filledBy", "u")
      .orderBy("mci.id", "ASC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, [
        "mci.observations",
        "v.licensePlate",
        "u.firstName",
        "u.lastName",
      ]);
    }

    // Apply filters
    if (filters) {
      applyFilters(qb, filters, {
        maintenanceChecklistId: { field: "mc.id" },
        passed: { field: "mci.passed" },
      });
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  async findOne(id: string): Promise<MaintenanceChecklistItem | null> {
    return this.qb()
      .leftJoinAndSelect("mci.maintenanceChecklist", "mc")
      .leftJoinAndSelect("mc.vehicle", "v")
      .leftJoinAndSelect("mc.filledBy", "u")
      .where("mci.id = :id", { id })
      .getOne();
  }

  create(data: Partial<MaintenanceChecklistItem>): MaintenanceChecklistItem {
    return this.repo.create(data);
  }

  createMany(
    data: Partial<MaintenanceChecklistItem>[],
  ): MaintenanceChecklistItem[] {
    return this.repo.create(data);
  }

  async save(
    entity: MaintenanceChecklistItem,
  ): Promise<MaintenanceChecklistItem> {
    return this.repo.save(entity);
  }

  async saveMany(
    entities: MaintenanceChecklistItem[],
  ): Promise<MaintenanceChecklistItem[]> {
    return this.repo.save(entities);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected != null && result.affected > 0;
  }
}
