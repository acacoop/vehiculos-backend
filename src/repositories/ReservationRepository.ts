import { DataSource, In, Repository } from "typeorm";
import { Reservation } from "@/entities/Reservation";
import {
  IReservationRepository,
  ReservationFilters,
} from "@/repositories/interfaces/IReservationRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export type { ReservationFilters };

export class ReservationRepository implements IReservationRepository {
  private readonly repo: Repository<Reservation>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Reservation);
  }

  async findAndCount(
    options?: RepositoryFindOptions<ReservationFilters>,
  ): Promise<[Reservation[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.repo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.user", "u")
      .leftJoinAndSelect("r.vehicle", "v")
      .leftJoinAndSelect("v.model", "m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("r.startDate", "DESC");

    // Apply search filter across user and vehicle information
    if (search) {
      applySearchFilter(qb, search, [
        "u.firstName",
        "u.lastName",
        "u.email",
        "u.cuit",
        "v.licensePlate",
        "v.chassisNumber",
        "b.name",
        "m.name",
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      userId: { field: "u.id" },
      vehicleId: { field: "v.id" },
    });

    // Pagination defaults (limit and offset optional)
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);
    return qb.getManyAndCount();
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
  delete(id: string) {
    return this.repo.delete(id);
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
