import { DataSource, Repository } from "typeorm";
import { MaintenanceRequirement } from "@/entities/MaintenanceRequirement";
import {
  IMaintenanceRequirementRepository,
  MaintenanceRequirementFilters,
} from "@/repositories/interfaces/IMaintenanceRequirementRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class MaintenanceRequirementRepository
  implements IMaintenanceRequirementRepository
{
  private readonly repo: Repository<MaintenanceRequirement>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceRequirement);
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceRequirementFilters>,
  ): Promise<[MaintenanceRequirement[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.repo
      .createQueryBuilder("mr")
      .leftJoinAndSelect("mr.model", "vm")
      .leftJoinAndSelect("vm.brand", "b")
      .leftJoinAndSelect("mr.maintenance", "m")
      .leftJoinAndSelect("m.category", "c")
      .orderBy("vm.name", "ASC")
      .addOrderBy("m.name", "ASC")
      .addOrderBy("mr.startDate", "DESC");

    // Apply search filter across multiple fields
    if (search) {
      applySearchFilter(qb, search, ["vm.name", "b.name", "m.name", "c.name"]);
    }

    // Apply individual filters
    const filterConfig: Record<string, { field: string; operator?: string }> = {
      modelId: { field: "vm.id" },
      maintenanceId: { field: "m.id" },
    };

    // Handle activeAt filter - requirements active at a specific date
    if (filters?.activeAt) {
      const activeDate = filters.activeAt;
      qb.andWhere(
        "(mr.startDate <= :activeDate AND (mr.endDate IS NULL OR mr.endDate >= :activeDate))",
        { activeDate },
      );
      // Remove activeAt from filters to avoid double processing
      const { activeAt: _activeAt, ...otherFilters } = filters;
      applyFilters(qb, otherFilters, filterConfig);
    } else {
      applyFilters(qb, filters, filterConfig);
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findByMaintenance(maintenanceId: string) {
    return this.repo.find({
      where: { maintenance: { id: maintenanceId } },
      relations: [
        "model",
        "model.brand",
        "maintenance",
        "maintenance.category",
      ],
      order: { startDate: "DESC" },
    });
  }

  findByModel(modelId: string) {
    return this.repo.find({
      where: { model: { id: modelId } },
      relations: [
        "model",
        "model.brand",
        "maintenance",
        "maintenance.category",
      ],
      order: { startDate: "DESC" },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: [
        "model",
        "model.brand",
        "maintenance",
        "maintenance.category",
      ],
    });
  }

  async findOverlapping(
    modelId: string,
    maintenanceId: string,
    startDate: string,
    endDate: string | null,
    excludeId?: string,
  ): Promise<MaintenanceRequirement[]> {
    const qb = this.repo
      .createQueryBuilder("mr")
      .where("mr.model.id = :modelId", { modelId })
      .andWhere("mr.maintenance.id = :maintenanceId", { maintenanceId });

    // Overlap logic:
    // Two date ranges [start1, end1] and [start2, end2] overlap if:
    // start1 <= end2 (or end2 is NULL) AND (end1 is NULL OR end1 >= start2)
    if (endDate) {
      // New requirement has an end date
      qb.andWhere(
        "(mr.startDate <= :endDate AND (mr.endDate IS NULL OR mr.endDate >= :startDate))",
        { startDate, endDate },
      );
    } else {
      // New requirement has no end date (open-ended)
      qb.andWhere("(mr.endDate IS NULL OR mr.endDate >= :startDate)", {
        startDate,
      });
    }

    // Exclude the current requirement if updating
    if (excludeId) {
      qb.andWhere("mr.id != :excludeId", { excludeId });
    }

    return qb.getMany();
  }

  create(data: Partial<MaintenanceRequirement>) {
    return this.repo.create(data);
  }

  save(entity: MaintenanceRequirement) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
