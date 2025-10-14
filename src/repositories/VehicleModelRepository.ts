import { DataSource, Repository } from "typeorm";
import { VehicleModel } from "../entities/VehicleModel";
import {
  IVehicleModelRepository,
  VehicleModelSearchParams,
  VehicleModelFindOptions,
} from "./interfaces/IVehicleModelRepository";

// Re-export types for convenience
export type { VehicleModelSearchParams, VehicleModelFindOptions };

export class VehicleModelRepository implements IVehicleModelRepository {
  private readonly repo: Repository<VehicleModel>;
  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleModel);
  }

  async findAndCount(
    options?: VehicleModelFindOptions,
  ): Promise<[VehicleModel[], number]> {
    const qb = this.repo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("b.name", "ASC")
      .addOrderBy("m.name", "ASC");
    if (options?.searchParams?.name) {
      qb.andWhere("m.name ILIKE :name", {
        name: `%${options.searchParams.name}%`,
      });
    }
    if (options?.searchParams?.brandId) {
      qb.andWhere("b.id = :brandId", { brandId: options.searchParams.brandId });
    }
    if (typeof options?.limit === "number") qb.take(options.limit);
    if (typeof options?.offset === "number") qb.skip(options.offset);
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
