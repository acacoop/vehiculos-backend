import { DataSource, Repository } from "typeorm";
import { VehicleBrand } from "@/entities/VehicleBrand";
import {
  IVehicleBrandRepository,
  VehicleBrandFilters,
} from "@/repositories/interfaces/IVehicleBrandRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class VehicleBrandRepository implements IVehicleBrandRepository {
  private readonly repo: Repository<VehicleBrand>;
  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleBrand);
  }

  async findAndCount(
    options?: RepositoryFindOptions<VehicleBrandFilters>,
  ): Promise<[VehicleBrand[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.repo.createQueryBuilder("vb").orderBy("vb.name", "ASC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, ["vb.name"]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      name: { field: "vb.name", operator: "LIKE" },
    });

    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit).skip(offset);

    return qb.getManyAndCount();
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
