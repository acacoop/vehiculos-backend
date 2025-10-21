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
import { applySearchFilter, applyFilters } from "@/utils";

export type { VehicleResponsibleFilters };

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

    // Handle active filter separately (complex condition)
    if (filters?.active === "true") {
      qb.andWhere("vr.end_date IS NULL");
    }
    if (filters?.active === "false") {
      qb.andWhere("vr.end_date IS NOT NULL");
    }

    // Handle date filter separately (complex condition)
    if (filters?.date) {
      qb.andWhere(
        "vr.startDate <= :d AND (vr.endDate IS NULL OR vr.endDate >= :d)",
        { d: filters.date },
      );
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findCurrentByVehicle(vehicleId: string) {
    return this.baseQuery()
      .where("vehicle.id = :vehicleId", { vehicleId })
      .andWhere("vr.end_date IS NULL")
      .getOne();
  }
  findCurrentForUser(userId: string) {
    return this.baseQuery()
      .where("user.id = :userId", { userId })
      .andWhere("vr.end_date IS NULL")
      .orderBy("vr.startDate", "DESC")
      .getMany();
  }
  findVehiclesForUserOnDate(userId: string, date: string) {
    return this.qb()
      .leftJoinAndSelect("vr.user", "user")
      .leftJoinAndSelect("vr.vehicle", "vehicle")
      .where("user.id = :userId", { userId })
      .andWhere(
        "vr.startDate <= :d AND (vr.endDate IS NULL OR vr.endDate >= :d)",
        { d: date },
      )
      .orderBy("vr.startDate", "DESC")
      .getMany();
  }
  getOverlap(
    vehicleId: string,
    startDate: string,
    endDate: string | null,
    excludeId?: string,
  ) {
    const qb = this.qb().where("vr.vehicle.id = :vehicleId", { vehicleId });
    if (excludeId) qb.andWhere("vr.id != :excludeId", { excludeId });
    qb.andWhere(
      "(:start < COALESCE(vr.endDate, :max)) AND (COALESCE(:end, :max) > vr.startDate)",
      { start: startDate, end: endDate, max: "9999-12-31" },
    );
    return qb.getOne();
  }

  /**
   * Find active responsible assignments for a specific date (defaults to today)
   * Active means: startDate <= date AND (endDate IS NULL OR endDate >= date)
   */
  async findActiveResponsibles(filters?: VehicleResponsibleFilters) {
    const targetDate = filters?.date || new Date().toISOString().split("T")[0];

    const [responsibles] = await this.find({
      filters: {
        userId: filters?.userId,
        vehicleId: filters?.vehicleId,
        date: targetDate,
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
    const responsibles = await this.findActiveResponsibles({
      userId,
      vehicleId,
      date,
    });
    return responsibles.length > 0;
  }
}
