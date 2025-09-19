import { DataSource, Repository } from "typeorm";
import { Vehicle as VehicleEntity } from "../entities/Vehicle";
import { VehicleModel } from "../entities/VehicleModel";
import { VehicleBrand } from "../entities/VehicleBrand";

export interface VehicleSearchParams {
  licensePlate?: string;
  brand?: string; // partial brand name search
  model?: string; // partial model name search
  brandId?: string;
  modelId?: string;
  year?: string; // still string from query params
}

export class VehicleRepository {
  private readonly repo: Repository<VehicleEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: VehicleSearchParams;
  }): Promise<[VehicleEntity[], number]> {
    const { searchParams, limit, offset } = options || {};
    const qb = this.repo
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.model", "m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("b.name", "ASC")
      .addOrderBy("m.name", "ASC")
      .addOrderBy("v.licensePlate", "ASC");

    if (searchParams) {
      if (searchParams.licensePlate) {
        qb.andWhere("v.licensePlate = :lp", {
          lp: searchParams.licensePlate,
        });
      }
      if (searchParams.year) {
        qb.andWhere("v.year = :year", { year: Number(searchParams.year) });
      }
      if (searchParams.brandId) {
        qb.andWhere("b.id = :brandId", { brandId: searchParams.brandId });
      }
      if (searchParams.modelId) {
        qb.andWhere("m.id = :modelId", { modelId: searchParams.modelId });
      }
      if (searchParams.brand) {
        qb.andWhere("b.name LIKE :brandName", {
          brandName: `%${searchParams.brand}%`,
        });
      }
      if (searchParams.model) {
        qb.andWhere("m.name LIKE :modelName", {
          modelName: `%${searchParams.model}%`,
        });
      }
    }

    if (typeof limit === "number") qb.take(limit);
    if (typeof offset === "number") qb.skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { model: { brand: true } },
    });
  }

  create(data: Partial<VehicleEntity>) {
    return this.repo.create(data);
  }

  save(entity: VehicleEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
