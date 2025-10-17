import {
  Brackets,
  DataSource,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  Or,
  SelectQueryBuilder,
} from "typeorm";
import { Assignment } from "../entities/Assignment";
import {
  IAssignmentRepository,
  AssignmentFilters,
} from "./interfaces/IAssignmentRepository";
import {
  PermissionFilterParams,
  RepositoryFindOptions,
  resolvePagination,
} from "./interfaces/common";
import { UserRoleEnum } from "../utils";
import { getAllowedPermissions } from "../utils";
import { applySearchFilter, applyFilters } from "../utils";

export type { AssignmentFilters };

export class AssignmentRepository implements IAssignmentRepository {
  private readonly repo: Repository<Assignment>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Assignment);
  }

  async findAndCount(
    options?: RepositoryFindOptions<AssignmentFilters>,
  ): Promise<[Assignment[], number]> {
    const { filters, search, pagination, permissions } = options || {};

    const qb = this.repo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.user", "u")
      .leftJoinAndSelect("a.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .orderBy("a.startDate", "DESC");

    // Apply search filter across user and vehicle information
    if (search) {
      applySearchFilter(qb, search, [
        "u.firstName",
        "u.lastName",
        "u.email",
        "v.licensePlate",
        "v.chassisNumber",
        "brand.name",
        "model.name",
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      userId: { field: "u.id" },
      vehicleId: { field: "v.id" },
      date: { field: "a.startDate", operator: "<=" }, // Filter for assignments active on date
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
   * Apply permission-based filtering to assignments
   * Users can only see assignments for vehicles they have access to
   */
  private applyPermissionFilter(
    qb: SelectQueryBuilder<Assignment>,
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

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  create(data: Partial<Assignment>) {
    return this.repo.create(data);
  }
  save(entity: Assignment) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }

  count(where: Record<string, unknown>) {
    return this.repo.count({ where });
  }

  /**
   * Find active assignments for today
   * Active means: startDate <= date AND (endDate IS NULL OR endDate >= date)
   */
  async findActiveAssignments(filters?: AssignmentFilters) {
    const targetDate = filters?.date || new Date().toISOString().split("T")[0];

    const where: Record<string, unknown> = {
      startDate: LessThanOrEqual(targetDate),
      endDate: Or(IsNull(), MoreThanOrEqual(targetDate)),
    };

    if (filters?.userId) {
      where.user = { id: filters.userId };
    }
    if (filters?.vehicleId) {
      where.vehicle = { id: filters.vehicleId };
    }

    return this.repo.find({ where });
  }

  /**
   * Check if user has active assignment for vehicle today
   */
  async hasActiveAssignment(
    userId: string,
    vehicleId: string,
    date?: string,
  ): Promise<boolean> {
    const assignments = await this.findActiveAssignments({
      userId,
      vehicleId,
      date,
    });
    return assignments.length > 0;
  }
}
