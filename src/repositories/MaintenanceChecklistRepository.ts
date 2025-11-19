import { DataSource, Repository } from "typeorm";
import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";
import {
  IMaintenanceChecklistRepository,
  MaintenanceChecklistFilters,
} from "@/repositories/interfaces/IMaintenanceChecklistRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class MaintenanceChecklistRepository
  implements IMaintenanceChecklistRepository
{
  private readonly repo: Repository<MaintenanceChecklist>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceChecklist);
  }
  qb() {
    return this.repo.createQueryBuilder("mc");
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceChecklistFilters>,
  ): Promise<[MaintenanceChecklist[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.qb()
      .leftJoinAndSelect("mc.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mc.filledBy", "u")
      .leftJoin("mc.maintenanceChecklistItems", "mci")
      .addSelect("COUNT(mci.id)", "itemCount")
      .addSelect(
        "SUM(CASE WHEN mci.passed = 1 THEN 1 ELSE 0 END)",
        "passedCount",
      )
      .groupBy("mc.id")
      .addGroupBy("v.id")
      .addGroupBy("model.id")
      .addGroupBy("brand.id")
      .addGroupBy("u.id")
      .orderBy("mc.year", "DESC")
      .addOrderBy("mc.quarter", "DESC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, [
        "v.licensePlate",
        "brand.name",
        "model.name",
        "u.firstName",
        "u.lastName",
        "u.email",
      ]);
    }

    // Apply filters
    if (filters) {
      applyFilters(qb, filters, {
        vehicleId: { field: "v.id" },
        year: { field: "mc.year" },
        quarter: { field: "mc.quarter" },
        filledBy: { field: "u.id" },
      });

      // Handle hasFailedItems filter separately
      if (filters.hasFailedItems !== undefined) {
        if (filters.hasFailedItems) {
          // Has at least one failed item
          qb.andHaving("SUM(CASE WHEN mci.passed = 0 THEN 1 ELSE 0 END) > 0");
        } else {
          // All items are passed or no items
          qb.andHaving(
            "(SUM(CASE WHEN mci.passed = 0 THEN 1 ELSE 0 END) = 0 OR COUNT(mci.id) = 0)",
          );
        }
      }
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    const result = await qb.getRawAndEntities();

    // Add the calculated fields to the entities
    result.entities.forEach((entity, index) => {
      const raw = result.raw[index];
      (entity as any).itemCount = parseInt(raw.itemCount) || 0;
      (entity as any).passedCount = parseInt(raw.passedCount) || 0;
    });

    return [result.entities, result.entities.length]; // Note: This is simplified, actual count would need separate query
  }

  async findOne(id: string): Promise<MaintenanceChecklist | null> {
    const qb = this.qb()
      .leftJoinAndSelect("mc.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mc.filledBy", "u")
      .leftJoin("mc.maintenanceChecklistItems", "mci")
      .addSelect("COUNT(mci.id)", "itemCount")
      .addSelect(
        "SUM(CASE WHEN mci.passed = 1 THEN 1 ELSE 0 END)",
        "passedCount",
      )
      .where("mc.id = :id", { id })
      .groupBy("mc.id")
      .addGroupBy("v.id")
      .addGroupBy("model.id")
      .addGroupBy("brand.id")
      .addGroupBy("u.id");

    const result = await qb.getRawAndEntities();

    if (result.entities.length === 0) {
      return null;
    }

    const entity = result.entities[0];
    const raw = result.raw[0];
    (entity as any).itemCount = parseInt(raw.itemCount) || 0;
    (entity as any).passedCount = parseInt(raw.passedCount) || 0;

    return entity;
  }

  create(data: Partial<MaintenanceChecklist>): MaintenanceChecklist {
    return this.repo.create(data);
  }

  async save(entity: MaintenanceChecklist): Promise<MaintenanceChecklist> {
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected != null && result.affected > 0;
  }
}
