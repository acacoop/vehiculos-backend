import { DataSource, In, Repository } from "typeorm";
import { Vehicle as VehicleEntity } from "@/entities/Vehicle";
import {
  IVehicleRepository,
  VehicleFilters,
} from "@/repositories/interfaces/IVehicleRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class VehicleRepository implements IVehicleRepository {
  private readonly repo: Repository<VehicleEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleEntity);
  }

  async findAndCount(
    options?: RepositoryFindOptions<VehicleFilters>,
  ): Promise<[VehicleEntity[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.repo
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.model", "m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("b.name", "ASC")
      .addOrderBy("m.name", "ASC")
      .addOrderBy("v.licensePlate", "ASC");

    // Apply search filter across multiple fields
    if (search) {
      applySearchFilter(qb, search, [
        "v.licensePlate",
        "v.chassisNumber",
        "b.name",
        "m.name",
      ]);
    }

    // Apply individual filters
    applyFilters(qb, filters, {
      licensePlate: { field: "v.licensePlate" },
      year: { field: "v.year", transform: (v) => Number(v) },
      minYear: { field: "v.year", operator: ">=", transform: (v) => Number(v) },
      maxYear: { field: "v.year", operator: "<=", transform: (v) => Number(v) },
      brandId: { field: "b.id" },
      modelId: { field: "m.id" },
      fuelType: { field: "v.fuelType" },
      registrationDateFrom: { field: "v.registrationDate", operator: ">=" },
      registrationDateTo: { field: "v.registrationDate", operator: "<=" },
    });

    // Apply kilometer range filters using subquery for latest kilometers
    if (filters?.minKilometers || filters?.maxKilometers) {
      qb.innerJoin(
        "vehicle_kilometers",
        "latestKm",
        `latestKm.vehicle_id = v.id AND latestKm.date = (
          SELECT MAX(vk2.date) FROM vehicle_kilometers vk2 WHERE vk2.vehicle_id = v.id
        )`,
      );

      if (filters.minKilometers) {
        qb.andWhere("latestKm.kilometers >= :minKilometers", {
          minKilometers: Number(filters.minKilometers),
        });
      }
      if (filters.maxKilometers) {
        qb.andWhere("latestKm.kilometers < :maxKilometers", {
          maxKilometers: Number(filters.maxKilometers),
        });
      }
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

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

  findByIds(ids: string[]) {
    return this.repo.find({
      where: { id: In(ids) },
      relations: { model: { brand: true } },
    });
  }

  findWithDetails(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { model: { brand: true } },
    });
  }
}
