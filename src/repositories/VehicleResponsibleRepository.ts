import { DataSource, Repository } from "typeorm";
import { VehicleResponsible as VehicleResponsibleEntity } from "../entities/VehicleResponsible";

export interface VehicleResponsibleSearchParams {
  vehicleId?: string;
  userId?: string;
  active?: string; // 'true' | 'false'
  date?: string; // ISO date
}

export class VehicleResponsibleRepository {
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
  find(options?: {
    searchParams?: VehicleResponsibleSearchParams;
    limit?: number;
    offset?: number;
  }) {
    const { searchParams, limit, offset } = options || {};
    const qb = this.baseQuery();
    if (searchParams?.vehicleId)
      qb.andWhere("vehicle.id = :vehicleId", {
        vehicleId: searchParams.vehicleId,
      });
    if (searchParams?.userId)
      qb.andWhere("user.id = :userId", { userId: searchParams.userId });
    if (searchParams?.active === "true") qb.andWhere("vr.end_date IS NULL");
    if (searchParams?.active === "false")
      qb.andWhere("vr.end_date IS NOT NULL");
    if (searchParams?.date)
      qb.andWhere(
        "vr.startDate <= :d AND (vr.endDate IS NULL OR vr.endDate >= :d)",
        { d: searchParams.date },
      );
    return qb
      .orderBy("vr.startDate", "DESC")
      .skip(offset)
      .take(limit)
      .getManyAndCount();
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
  async findActiveResponsibles(searchParams?: VehicleResponsibleSearchParams) {
    const targetDate =
      searchParams?.date || new Date().toISOString().split("T")[0];

    const [responsibles] = await this.find({
      searchParams: {
        userId: searchParams?.userId,
        vehicleId: searchParams?.vehicleId,
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
