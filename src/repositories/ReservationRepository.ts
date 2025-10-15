import { DataSource, In, Repository, SelectQueryBuilder } from "typeorm";
import { Reservation } from "../entities/Reservation";
import {
  IReservationRepository,
  ReservationSearchParams,
} from "./interfaces/IReservationRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "./interfaces/common";
import { UserRoleEnum } from "../utils/common";
import { getAllowedPermissions } from "../utils/permissions";

export type { ReservationSearchParams };

export class ReservationRepository implements IReservationRepository {
  private readonly repo: Repository<Reservation>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Reservation);
  }

  async findAndCount(
    options?: RepositoryFindOptions<ReservationSearchParams>,
  ): Promise<[Reservation[], number]> {
    const { searchParams, pagination, permissions } = options || {};

    const qb = this.repo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.user", "u")
      .leftJoinAndSelect("r.vehicle", "v")
      .orderBy("r.startDate", "DESC");

    // Apply search filters
    if (searchParams?.userId) {
      qb.andWhere("u.id = :userId", { userId: searchParams.userId });
    }
    if (searchParams?.vehicleId) {
      qb.andWhere("v.id = :vehicleId", { vehicleId: searchParams.vehicleId });
    }

    // Apply permission-based filtering
    if (permissions?.userId && permissions.userRole !== UserRoleEnum.ADMIN) {
      this.applyPermissionFilter(qb, permissions);
    }

    // Pagination defaults (limit and offset optional)
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);    return qb.getManyAndCount();
  }

  /**
   * Apply permission-based filtering to reservations
   * Users can only see reservations for vehicles they have access to
   */
  private applyPermissionFilter(
    qb: SelectQueryBuilder<Reservation>,
    permissions: RepositoryFindOptions["permissions"],
  ): void {
    const now = new Date();
    const { userId, requiredPermission } = permissions!;

    qb.andWhere(
      `(
        EXISTS (
          SELECT 1 FROM vehicle_acl acl
          WHERE acl.vehicle_id = v.id
          AND acl.user_id = :userId
          AND acl.start_time <= :now
          AND (acl.end_time IS NULL OR acl.end_time > :now)
          ${requiredPermission ? "AND acl.permission IN (:...allowedPermissions)" : ""}
        )
        OR EXISTS (
          SELECT 1 FROM vehicle_responsibles vr
          WHERE vr.vehicle_id = v.id
          AND vr.user_id = :userId
          AND vr.start_time <= :now
          AND (vr.end_time IS NULL OR vr.end_time > :now)
        )
        OR EXISTS (
          SELECT 1 FROM assignments asn
          WHERE asn.vehicle_id = v.id
          AND asn.user_id = :userId
          AND asn.start_date <= CURRENT_DATE
          AND (asn.end_date IS NULL OR asn.end_date >= CURRENT_DATE)
        )
      )`,
      {
        userId,
        now,
        ...(requiredPermission && {
          allowedPermissions: getAllowedPermissions(requiredPermission),
        }),
      },
    );
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
