import { DataSource, Repository } from "typeorm";
import { VehicleModel } from "../entities/VehicleModel";
import {
  IVehicleModelRepository,
  VehicleModelSearchParams,
} from "./interfaces/IVehicleModelRepository";
import { RepositoryFindOptions, resolvePagination } from "./interfaces/common";

// Re-export types for convenience
export type { VehicleModelSearchParams };

export class VehicleModelRepository implements IVehicleModelRepository {
  private readonly repo: Repository<VehicleModel>;
  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleModel);
  }

  async findAndCount(
    options?: RepositoryFindOptions<VehicleModelSearchParams>,
  ): Promise<[VehicleModel[], number]> {
    const { searchParams, pagination } = options || {};
    const qb = this.repo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("b.name", "ASC")
      .addOrderBy("m.name", "ASC");
    if (searchParams?.name) {
      qb.andWhere("m.name ILIKE :name", {
        name: `%${searchParams.name}%`,
      });
    }
    if (searchParams?.brandId) {
      qb.andWhere("b.id = :brandId", { brandId: searchParams.brandId });
    }
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);
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
