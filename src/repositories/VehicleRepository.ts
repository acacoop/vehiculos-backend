import {
  Brackets,
  DataSource,
  In,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { Vehicle as VehicleEntity } from "../entities/Vehicle";
import {
  IVehicleRepository,
  VehicleSearchParams,
} from "./interfaces/IVehicleRepository";
import { PERMISSION_WEIGHT, PermissionType } from "../utils/common";
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

    // If permissions are required and user is not ADMIN, apply filters
    if (permissions && permissions.userRole !== UserRoleEnum.ADMIN) {
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
    const { userId, requiredPermission } = permissions;

    // Build a complex WHERE clause that checks:
    // 1. User has an active ACL for the vehicle with sufficient permission
    // 2. User is the current responsible (grants FULL permission)
    // 3. User is the current driver (grants DRIVER permission)
    qb.andWhere(
      new Brackets((qb) => {
        qb.orWhere(
          `(
            EXISTS (
              SELECT 1 FROM vehicle_acl acl
              WHERE acl.vehicle_id = v.id
              AND acl.user_id = :userId
          AND acl.start_time <= :now
          AND (acl.end_time IS NULL OR acl.end_time > :now)
          AND acl.permission IN (:...allowedPermissions)
          )`,
          {
            userId: permissions.userId,
            now: now.toISOString(),
            allowedPermissions: getAllowedPermissions(requiredPermission),
          },
        );

        qb.orWhere(
          `(
        EXISTS (
          SELECT 1 FROM vehicle_responsibles vr
          WHERE vr.vehicle_id = v.id
          AND vr.user_id = :userId
          AND vr.start_date <= :now
          AND (vr.end_date IS NULL OR vr.end_date > :now)
        )
      )`,
          {
            userId: userId,
            now: now.toISOString(),
          },
        );

        if (
          PERMISSION_WEIGHT[permissions.requiredPermission] <=
          PERMISSION_WEIGHT[PermissionType.DRIVER]
        ) {
          qb.andWhere(
            `(EXISTS (
          SELECT 1 FROM vehicle_drivers vd
          WHERE vd.vehicle_id = v.id
          AND vd.user_id = :userId
          AND vd.start_date <= :now
          AND (vd.end_date IS NULL OR vd.end_date > :now)
        )
      )`,
            {
              userId: userId,
              now: now.toISOString(),
            },
          );
        }
      }),
    );
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
