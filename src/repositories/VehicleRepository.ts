import { DataSource, Like, Repository } from "typeorm";
import { Vehicle as VehicleEntity } from "../entities/Vehicle";

export interface VehicleSearchParams {
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: string; // kept as string because it comes from query params
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
    const { searchParams } = options || {};
    const where: Record<string, unknown> = {};
    if (searchParams) {
      if (searchParams.licensePlate)
        where.licensePlate = searchParams.licensePlate;
      if (searchParams.brand) where.brand = Like(`%${searchParams.brand}%`);
      if (searchParams.model) where.model = Like(`%${searchParams.model}%`);
      if (searchParams.year) where.year = Number(searchParams.year);
    }
    return this.repo.findAndCount({
      where,
      take: options?.limit,
      skip: options?.offset,
      order: { brand: "ASC", model: "ASC" },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
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
