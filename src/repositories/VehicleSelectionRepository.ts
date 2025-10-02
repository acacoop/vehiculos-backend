import { DataSource, Repository } from "typeorm";
import { VehicleSelection as VehicleSelectionEntity } from "../entities/authorization/VehicleSelection";

export class VehicleSelectionRepository {
  private readonly repo: Repository<VehicleSelectionEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleSelectionEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
  }): Promise<[VehicleSelectionEntity[], number]> {
    return this.repo.findAndCount({
      take: options?.limit,
      skip: options?.offset,
      order: { id: "ASC" },
      relations: { vehicles: true },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { vehicles: true },
    });
  }

  create(data: Partial<VehicleSelectionEntity>) {
    return this.repo.create(data);
  }

  save(entity: VehicleSelectionEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
