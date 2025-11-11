import { DataSource, Repository } from "typeorm";
import { MaintenanceCategory } from "@/entities/MaintenanceCategory";
import {
  IMaintenanceCategoryRepository,
  MaintenanceCategoryFilters,
} from "@/repositories/interfaces/IMaintenanceCategoryRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class MaintenanceCategoryRepository
  implements IMaintenanceCategoryRepository
{
  private readonly repo: Repository<MaintenanceCategory>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceCategory);
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceCategoryFilters>,
  ): Promise<[MaintenanceCategory[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.repo.createQueryBuilder("mc").orderBy("mc.name", "ASC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, ["mc.name"]);
    }

    // Apply individual filters
    applyFilters(qb, filters, {
      name: { field: "mc.name", operator: "LIKE" },
    });

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findAll() {
    return this.repo.find({ order: { name: "ASC" } });
  }
  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  create(data: Partial<MaintenanceCategory>) {
    return this.repo.create(data);
  }
  save(entity: MaintenanceCategory) {
    return this.repo.save(entity);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
}
