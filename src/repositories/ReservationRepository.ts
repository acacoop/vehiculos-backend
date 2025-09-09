import { DataSource, In, Repository } from "typeorm";
import { Reservation } from "../entities/Reservation";

export interface ReservationSearchParams {
  userId?: string;
  vehicleId?: string;
}

export class ReservationRepository {
  private readonly repo: Repository<Reservation>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Reservation);
  }
  findAndCount(opts?: {
    limit?: number;
    offset?: number;
    searchParams?: ReservationSearchParams;
  }) {
    const { searchParams } = opts || {};
    const where: Record<string, unknown> = {};
    if (searchParams?.userId) where.user = { id: searchParams.userId };
    if (searchParams?.vehicleId) where.vehicle = { id: searchParams.vehicleId };
    return this.repo.findAndCount({
      where,
      take: opts?.limit,
      skip: opts?.offset,
      order: { startDate: "DESC" },
    });
  }
  find(where: Record<string, unknown>) {
    return this.repo.find({ where, order: { startDate: "DESC" } });
  }
  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  create(data: Partial<Reservation>) {
    return this.repo.create(data);
  }
  save(entity: Reservation) {
    return this.repo.save(entity);
  }
  distinctVehicleIdsByAssignedUser(userId: string) {
    return this.repo
      .createQueryBuilder("r")
      .select("DISTINCT r.vehicle_id", "vehicleId")
      .innerJoin("assignments", "a", "a.vehicle_id = r.vehicle_id")
      .where("a.user_id = :userId", { userId })
      .getRawMany();
  }
  findByVehicleIds(vehicleIds: string[]) {
    return this.repo.find({
      where: { vehicle: { id: In(vehicleIds) } },
      order: { startDate: "DESC" },
    });
  }
  qb() {
    return this.repo.createQueryBuilder("r");
  }
}
