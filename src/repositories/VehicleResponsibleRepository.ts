import { DataSource, Repository } from "typeorm";
import { VehicleResponsible as VehicleResponsibleEntity } from "@/entities/VehicleResponsible";
import {
  IVehicleResponsibleRepository,
  VehicleResponsibleFilters,
} from "@/repositories/interfaces/IVehicleResponsibleRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import {
  applySearchFilter,
  applyFilters,
  applyActiveFilter,
} from "@/utils/index";

export class VehicleResponsibleRepository
  implements IVehicleResponsibleRepository
{
  private readonly repo: Repository<VehicleResponsibleEntity>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(VehicleResponsibleEntity);
  }

  qb() {
    return this.repo.createQueryBuilder("vr");
  }
  private baseQuery() {
    return this.qb()
      .leftJoinAndSelect("vr.user", "user")
      .leftJoinAndSelect("vr.vehicle", "vehicle")
      .leftJoinAndSelect("vehicle.model", "model")
      .leftJoinAndSelect("model.brand", "brand");
  }
  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  findDetailedById(id: string) {
    return this.baseQuery().where("vr.id = :id", { id }).getOne();
  }
  save(ent: VehicleResponsibleEntity) {
    return this.repo.save(ent);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
  create(data: Partial<VehicleResponsibleEntity>) {
    return this.repo.create(data);
  }

  async find(
    options?: RepositoryFindOptions<VehicleResponsibleFilters>,
  ): Promise<[VehicleResponsibleEntity[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.baseQuery();

    // Apply search filter across user and vehicle information
    if (search) {
      applySearchFilter(qb, search, [
        "user.firstName",
        "user.lastName",
        "user.email",
        "vehicle.licensePlate",
        "vehicle.chassisNumber",
        "brand.name",
        "model.name",
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      vehicleId: { field: "vehicle.id" },
      userId: { field: "user.id" },
    });

    // Apply active filter for date filtering
    if (filters?.active) {
      applyActiveFilter(
        qb,
        new Date().toISOString().split("T")[0],
        "vr.startDate",
        "vr.endDate",
      );
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findCurrentByVehicle(vehicleId: string) {
    const qb = this.baseQuery().where("vehicle.id = :vehicleId", { vehicleId });
    applyActiveFilter(
      qb,
      new Date().toISOString().split("T")[0],
      "vr.startDate",
      "vr.endDate",
    );
    return qb.getOne();
  }
  findCurrentForUser(userId: string) {
    const qb = this.baseQuery().where("user.id = :userId", { userId });
    applyActiveFilter(
      qb,
      new Date().toISOString().split("T")[0],
      "vr.startDate",
      "vr.endDate",
    );
    return qb.orderBy("vr.startDate", "DESC").getMany();
  }
  findVehiclesForUserOnDate(userId: string, date: string) {
    const qb = this.qb()
      .leftJoinAndSelect("vr.user", "user")
      .leftJoinAndSelect("vr.vehicle", "vehicle")
      .where("user.id = :userId", { userId });
    applyActiveFilter(qb, date, "vr.startDate", "vr.endDate");
    return qb.orderBy("vr.startDate", "DESC").getMany();
  }
  /**
   * Find active responsible assignments for a specific date (defaults to today)
   * Active means: startDate <= date AND (endDate IS NULL OR endDate >= date)
   */
  async findActiveResponsibles(filters?: VehicleResponsibleFilters) {
    const [responsibles] = await this.find({
      filters: {
        userId: filters?.userId,
        vehicleId: filters?.vehicleId,
        active: true,
      },
    });

    return responsibles;
  }

  /**
   * Check if user is responsible for vehicle on specific date (defaults to today)
   */
  async isUserResponsible(
    userId: string,
    vehicleId: string,
    date?: string,
  ): Promise<boolean> {
    if (date) {
      // If a specific date is provided, we need to check against that date
      const qb = this.baseQuery()
        .where("user.id = :userId", { userId })
        .andWhere("vehicle.id = :vehicleId", { vehicleId });
      applyActiveFilter(qb, date, "vr.startDate", "vr.endDate");
      const count = await qb.getCount();
      return count > 0;
    } else {
      // Use the standard active filter
      const responsibles = await this.findActiveResponsibles({
        userId,
        vehicleId,
      });
      return responsibles.length > 0;
    }
  }
}
