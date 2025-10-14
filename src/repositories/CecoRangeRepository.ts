import { DataSource, Repository } from "typeorm";
import { CecoRange as CecoRangeEntity } from "../entities/authorization/CecoRange";

export interface CecoRangeSearchParams {
  vehicleSelectionId?: string;
  startCeco?: string;
  endCeco?: string;
}

export class CecoRangeRepository {
  private readonly repo: Repository<CecoRangeEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(CecoRangeEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: CecoRangeSearchParams;
  }): Promise<[CecoRangeEntity[], number]> {
    const { searchParams, limit, offset } = options || {};
    const qb = this.repo
      .createQueryBuilder("cr")
      .leftJoinAndSelect("cr.vehicleSelection", "vs")
      .orderBy("cr.startCeco", "ASC");

    if (searchParams) {
      if (searchParams.vehicleSelectionId) {
        qb.andWhere("vs.id = :vehicleSelectionId", { vehicleSelectionId: searchParams.vehicleSelectionId });
      }
      if (searchParams.startCeco) {
        qb.andWhere("cr.start_ceco = :startCeco", { startCeco: Number(searchParams.startCeco) });
      }
      if (searchParams.endCeco) {
        qb.andWhere("cr.end_ceco = :endCeco", { endCeco: Number(searchParams.endCeco) });
      }
    }

    if (typeof limit === "number") qb.take(limit);
    if (typeof offset === "number") qb.skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { vehicleSelection: true },
    });
  }

  create(data: Partial<CecoRangeEntity>) {
    return this.repo.create(data);
  }

  save(entity: CecoRangeEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
