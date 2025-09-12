import { DataSource, IsNull, Repository } from "typeorm";
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
  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
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
    const qb = this.qb()
      .leftJoinAndSelect("vr.user", "user")
      .leftJoinAndSelect("vr.vehicle", "vehicle");
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
        { d: searchParams.date }
      );
    return qb
      .orderBy("vr.startDate", "DESC")
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }
  findCurrentByVehicle(vehicleId: string) {
    return this.repo.findOne({
      where: { vehicle: { id: vehicleId }, endDate: IsNull() },
    });
  }
  findCurrentForUser(userId: string) {
    return this.repo.find({
      where: { user: { id: userId }, endDate: IsNull() },
      order: { startDate: "DESC" },
    });
  }
  findVehiclesForUserOnDate(userId: string, date: string) {
    return this.qb()
      .leftJoinAndSelect("vr.user", "user")
      .leftJoinAndSelect("vr.vehicle", "vehicle")
      .where("user.id = :userId", { userId })
      .andWhere(
        "vr.startDate <= :d AND (vr.endDate IS NULL OR vr.endDate >= :d)",
        { d: date }
      )
      .orderBy("vr.startDate", "DESC")
      .getMany();
  }
  getOverlap(
    vehicleId: string,
    startDate: string,
    endDate: string | null,
    excludeId?: string
  ) {
    const qb = this.qb().where("vr.vehicle.id = :vehicleId", { vehicleId });
    if (excludeId) qb.andWhere("vr.id != :excludeId", { excludeId });
    qb.andWhere(
      "(:start < COALESCE(vr.endDate, :max)) AND (COALESCE(:end, :max) > vr.startDate)",
      { start: startDate, end: endDate, max: "9999-12-31" }
    );
    return qb.getOne();
  }
}
