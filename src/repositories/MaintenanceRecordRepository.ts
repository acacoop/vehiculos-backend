import { DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { MaintenanceRecord } from "../entities/MaintenanceRecord";
import {
  IMaintenanceRecordRepository,
  MaintenanceRecordSearchParams,
} from "./interfaces/IMaintenanceRecordRepository";
import { RepositoryFindOptions, resolvePagination } from "./interfaces/common";
import { UserRoleEnum } from "../utils/common";
import { getAllowedPermissions } from "../utils/permissions";

export type { MaintenanceRecordSearchParams };

export class MaintenanceRecordRepository
  implements IMaintenanceRecordRepository
{
  private readonly repo: Repository<MaintenanceRecord>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceRecord);
  }
  qb() {
    return this.repo.createQueryBuilder("mr");
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceRecordSearchParams>,
  ): Promise<[MaintenanceRecord[], number]> {
    const { searchParams, pagination, permissions } = options || {};

    const qb = this.qb()
      .leftJoinAndSelect("mr.assignedMaintenance", "am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("am.maintenance", "m")
      .leftJoinAndSelect("mr.user", "u")
      .orderBy("mr.date", "DESC");

    // Apply search filters
    if (searchParams?.userId) {
      qb.andWhere("u.id = :userId", { userId: searchParams.userId });
    }
    if (searchParams?.vehicleId) {
      qb.andWhere("v.id = :vehicleId", { vehicleId: searchParams.vehicleId });
    }
    if (searchParams?.maintenanceId) {
      qb.andWhere("m.id = :maintenanceId", {
        maintenanceId: searchParams.maintenanceId,
      });
    }
    if (searchParams?.assignedMaintenanceId) {
      qb.andWhere("am.id = :assignedMaintenanceId", {
        assignedMaintenanceId: searchParams.assignedMaintenanceId,
      });
    }

    // Apply permission-based filtering
    if (permissions?.userId && permissions.userRole !== UserRoleEnum.ADMIN) {
      this.applyPermissionFilter(qb, permissions);
    }

    // Pagination defaults (limit and offset optional)
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  /**
   * Apply permission-based filtering to maintenance records
   * Users can only see records for vehicles they have access to
   */
  private applyPermissionFilter(
    qb: SelectQueryBuilder<MaintenanceRecord>,
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

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  findByVehicle(vehicleId: string) {
    return this.qb()
      .leftJoinAndSelect("mr.assignedMaintenance", "am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("am.maintenance", "m")
      .leftJoinAndSelect("mr.user", "u")
      .where("v.id = :vehicleId", { vehicleId })
      .orderBy("mr.date", "DESC")
      .getMany();
  }
  create(data: Partial<MaintenanceRecord>) {
    return this.repo.create(data);
  }
  save(entity: MaintenanceRecord) {
    return this.repo.save(entity);
  }
  findByAssignedMaintenance(assignedMaintenanceId: string) {
    return this.repo.find({
      where: { assignedMaintenance: { id: assignedMaintenanceId } },
      order: { date: "DESC" },
    });
  }
}
