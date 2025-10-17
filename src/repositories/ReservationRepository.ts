import {
  Brackets,
  DataSource,
  In,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { Reservation } from "../entities/Reservation";
import {
  IReservationRepository,
  ReservationFilters,
} from "./interfaces/IReservationRepository";
import {
  PermissionFilterParams,
  RepositoryFindOptions,
  resolvePagination,
} from "./interfaces/common";
import { UserRoleEnum } from "../utils";
import { getAllowedPermissions } from "../utils";
import { applySearchFilter, applyFilters } from "../utils";

export type { ReservationFilters };

export class ReservationRepository implements IReservationRepository {
  private readonly repo: Repository<Reservation>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Reservation);
  }

  async findAndCount(
    options?: RepositoryFindOptions<ReservationFilters>,
  ): Promise<[Reservation[], number]> {
    const { filters, search, pagination, permissions } = options || {};

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

    // Apply permission-based filtering
    if (permissions && permissions.userRole !== UserRoleEnum.ADMIN) {
      this.applyPermissionFilter(qb, permissions);
    }

    // Pagination defaults (limit and offset optional)
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);
    return qb.getManyAndCount();
  }

  /**
   * Apply permission-based filtering to reservations
   * Users can only see reservations for vehicles they have access to
   */
  private applyPermissionFilter(
    qb: SelectQueryBuilder<Reservation>,
    permissions: PermissionFilterParams,
  ): void {
    const now = new Date();
    const { userId, requiredPermission } = permissions;

    qb.andWhere(
      new Brackets((qb) => {
        // User has an active ACL for the vehicle
        qb.orWhere(
          `EXISTS (
            SELECT 1 FROM vehicle_acl acl
            WHERE acl.vehicle_id = v.id
            AND acl.user_id = :userId
            AND acl.start_time <= :now
            AND (acl.end_time IS NULL OR acl.end_time > :now)
            AND acl.permission IN (:...allowedPermissions)
          )`,
          {
            userId,
            now: now.toISOString(),
            allowedPermissions: getAllowedPermissions(requiredPermission),
          },
        );

        // User is the current responsible for the vehicle
        qb.orWhere(
          `EXISTS (
            SELECT 1 FROM vehicle_responsibles vr
            WHERE vr.vehicle_id = v.id
            AND vr.user_id = :userId
            AND vr.start_date <= :now
            AND (vr.end_date IS NULL OR vr.end_date > :now)
          )`,
          {
            userId,
            now: now.toISOString(),
          },
        );

        // User is currently assigned to the vehicle
        qb.orWhere(
          `EXISTS (
            SELECT 1 FROM assignments asn
            WHERE asn.vehicle_id = v.id
            AND asn.user_id = :userId
            AND asn.start_date <= :now
            AND (asn.end_date IS NULL OR asn.end_date > :now)
          )`,
          {
            userId,
            now: now.toISOString(),
          },
        );
      }),
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
