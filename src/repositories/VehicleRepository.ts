import { DataSource, In, Repository, SelectQueryBuilder } from "typeorm";
import { Vehicle as VehicleEntity } from "../entities/Vehicle";
import {
  IVehicleRepository,
  VehicleSearchParams,
} from "./interfaces/IVehicleRepository";
import { PermissionType } from "../utils/common";
import { UserRoleEnum } from "../utils/common";
import {
  RepositoryFindOptions,
  PermissionFilterParams,
  resolvePagination,
} from "./interfaces/common";
import { getAllowedPermissions } from "../utils/permissions";

export class VehicleRepository implements IVehicleRepository {
  private readonly repo: Repository<VehicleEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleEntity);
  }

  async findAndCount(
    options?: RepositoryFindOptions<VehicleSearchParams>,
  ): Promise<[VehicleEntity[], number]> {
    const { searchParams, pagination, permissions } = options || {};
    const qb = this.repo
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.model", "m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("b.name", "ASC")
      .addOrderBy("m.name", "ASC")
      .addOrderBy("v.licensePlate", "ASC");

    if (searchParams) {
      // Standard search filters
      if (searchParams.licensePlate) {
        qb.andWhere("v.licensePlate = :lp", {
          lp: searchParams.licensePlate,
        });
      }
      if (searchParams.year) {
        qb.andWhere("v.year = :year", { year: Number(searchParams.year) });
      }
      if (searchParams.brandId) {
        qb.andWhere("b.id = :brandId", { brandId: searchParams.brandId });
      }
      if (searchParams.modelId) {
        qb.andWhere("m.id = :modelId", { modelId: searchParams.modelId });
      }
      if (searchParams.brand) {
        qb.andWhere("b.name LIKE :brandName", {
          brandName: `%${searchParams.brand}%`,
        });
      }
      if (searchParams.model) {
        qb.andWhere("m.name LIKE :modelName", {
          modelName: `%${searchParams.model}%`,
        });
      }
    }

    // Permission-based filtering
    // If userId is provided and user is not ADMIN, filter by permissions
    if (permissions?.userId && permissions.userRole !== UserRoleEnum.ADMIN) {
      this.applyPermissionFilter(qb, permissions);
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  /**
   * Apply permission-based filtering to the query builder
   * Filters vehicles based on user's ACLs, assignments, and responsibilities
   */
  private applyPermissionFilter(
    qb: SelectQueryBuilder<VehicleEntity>,
    permissions: PermissionFilterParams,
  ): void {
    const now = new Date();

    // Build a complex WHERE clause that checks:
    // 1. User has an active ACL for the vehicle with sufficient permission
    // 2. User is the current responsible (grants FULL permission)
    // 3. User is the current driver (grants DRIVER permission)
    qb.andWhere(
      `(
        EXISTS (
          SELECT 1 FROM vehicle_acl acl
          WHERE acl.vehicle_id = v.id
          AND acl.user_id = :userId
          AND acl.start_time <= :now
          AND (acl.end_time IS NULL OR acl.end_time > :now)
          ${permissions.requiredPermission ? "AND acl.permission IN (:...allowedPermissions)" : ""}
        )
        OR EXISTS (
          SELECT 1 FROM vehicle_responsibles vr
          WHERE vr.vehicle_id = v.id
          AND vr.user_id = :userId
          AND vr.start_date <= :now
          AND (vr.end_date IS NULL OR vr.end_date > :now)
        )
        OR EXISTS (
          SELECT 1 FROM assignments a
          WHERE a.vehicle_id = v.id
          AND a.user_id = :userId
          AND a.start_date <= :now
          AND (a.end_date IS NULL OR a.end_date > :now)
          ${permissions.requiredPermission === PermissionType.FULL ? "AND 1=0" : ""}
        )
      )`,
      {
        userId: permissions.userId,
        now: now.toISOString(),
      },
    );

    // If a specific permission is required, calculate allowed permissions
    // based on permission hierarchy
    if (permissions.requiredPermission) {
      const allowedPermissions = getAllowedPermissions(
        permissions.requiredPermission,
      );
      qb.setParameter("allowedPermissions", allowedPermissions);
    }
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { model: { brand: true } },
    });
  }

  create(data: Partial<VehicleEntity>) {
    return this.repo.create(data);
  }

  save(entity: VehicleEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }

  findByIds(ids: string[]) {
    return this.repo.find({
      where: { id: In(ids) },
      relations: { model: { brand: true } },
    });
  }

  findWithDetails(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { model: { brand: true } },
    });
  }
}
