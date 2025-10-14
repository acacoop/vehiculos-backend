import { DataSource, ILike, Repository } from "typeorm";
import { VehicleBrand } from "../entities/VehicleBrand";
import {
  IVehicleBrandRepository,
  VehicleBrandSearchParams,
  VehicleBrandFindOptions,
} from "./interfaces/IVehicleBrandRepository";

// Re-export types for convenience
export type { VehicleBrandSearchParams, VehicleBrandFindOptions };

export class VehicleBrandRepository implements IVehicleBrandRepository {
  private readonly repo: Repository<VehicleBrand>;
  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleBrand);
  }

  async findAndCount(
    options?: VehicleBrandFindOptions,
  ): Promise<[VehicleBrand[], number]> {
    const where: Record<string, unknown> = {};
    if (options?.searchParams?.name) {
      where.name = ILike(`%${options.searchParams.name}%`);
    }
    return this.repo.findAndCount({
      where,
      take: options?.limit,
      skip: options?.offset,
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
