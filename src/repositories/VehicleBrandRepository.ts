import { DataSource, ILike, Repository } from "typeorm";
import { VehicleBrand } from "../entities/VehicleBrand";
import {
  IVehicleBrandRepository,
  VehicleBrandSearchParams,
} from "./interfaces/IVehicleBrandRepository";
import { RepositoryFindOptions, resolvePagination } from "./interfaces/common";

// Re-export types for convenience
export type { VehicleBrandSearchParams };

export class VehicleBrandRepository implements IVehicleBrandRepository {
  private readonly repo: Repository<VehicleBrand>;
  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleBrand);
  }

  async findAndCount(
    options?: RepositoryFindOptions<VehicleBrandSearchParams>,
  ): Promise<[VehicleBrand[], number]> {
    const { searchParams, pagination } = options || {};
    const where: Record<string, unknown> = {};
    if (searchParams?.name) {
      where.name = ILike(`%${searchParams.name}%`);
    }
    const { limit, offset } = resolvePagination(pagination);
    return this.repo.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { name: "ASC" },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findOneByWhere(where: { id: string }) {
    return this.repo.findOne({ where });
  }

  create(data: Partial<VehicleBrand>) {
    return this.repo.create(data);
  }
  save(entity: VehicleBrand) {
    return this.repo.save(entity);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
}
