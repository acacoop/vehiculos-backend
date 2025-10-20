import { DataSource, Repository } from "typeorm";
import { VehicleModel } from "entities/VehicleModel";
import {
  IVehicleModelRepository,
  VehicleModelFilters,
} from "./interfaces/IVehicleModelRepository";
import { RepositoryFindOptions, resolvePagination } from "./interfaces/common";
import { applySearchFilter, applyFilters } from "utils";

// Re-export types for convenience
export type { VehicleModelFilters };

export class VehicleModelRepository implements IVehicleModelRepository {
  private readonly repo: Repository<VehicleModel>;
  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleModel);
  }

  async findAndCount(
    options?: RepositoryFindOptions<VehicleModelFilters>,
  ): Promise<[VehicleModel[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.repo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("b.name", "ASC")
      .addOrderBy("m.name", "ASC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, ["m.name", "b.name"]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      name: { field: "m.name", operator: "LIKE" },
      brandId: { field: "b.id" },
    });

    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit).skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: { brand: true } });
  }
  create(data: Partial<VehicleModel>) {
    return this.repo.create(data);
  }
  save(entity: VehicleModel) {
    return this.repo.save(entity);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
}
