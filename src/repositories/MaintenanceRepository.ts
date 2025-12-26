import { DataSource, Repository } from "typeorm";
import { Maintenance } from "@/entities/Maintenance";
import {
  IMaintenanceRepository,
  MaintenanceFilters,
} from "@/repositories/interfaces/IMaintenanceRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class MaintenanceRepository implements IMaintenanceRepository {
  private readonly repo: Repository<Maintenance>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Maintenance);
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceFilters>,
  ): Promise<[Maintenance[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.repo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.category", "c")
      .orderBy("c.name", "ASC")
      .addOrderBy("m.name", "ASC");

    // Apply search filter across multiple fields
    if (search) {
      applySearchFilter(qb, search, ["m.name", "c.name", ["c.name", "m.name"]]);
    }

    // Apply individual filters
    applyFilters(qb, filters, {
      name: { field: "m.name", operator: "LIKE" },
      categoryId: { field: "c.id" },
    });

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findAll() {
    return this.repo.find({ relations: ["category"], order: { name: "ASC" } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ["category"] });
  }

  create(data: Partial<Maintenance>) {
    return this.repo.create(data);
  }

  save(entity: Maintenance) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
