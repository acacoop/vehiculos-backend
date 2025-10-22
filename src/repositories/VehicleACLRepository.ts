import { DataSource, Repository } from "typeorm";
import { VehicleACL as VehicleACLEntity } from "@/entities/VehicleACL";
import { PermissionType, PERMISSION_WEIGHT } from "@/enums/PermissionType";
import { resolvePagination } from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils";

export interface VehicleACLFilters {
  userId?: string;
  vehicleId?: string;
  permission?: PermissionType;
  activeAt?: Date; // Filter for ACLs active at a specific time
}

export class VehicleACLRepository {
  private readonly repo: Repository<VehicleACLEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleACLEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    filters?: VehicleACLFilters;
    search?: string;
  }): Promise<[VehicleACLEntity[], number]> {
    const { filters, search, limit, offset } = options || {};
    const { limit: resolvedLimit, offset: resolvedOffset } = resolvePagination({
      limit,
      offset,
    });

    const qb = this.repo
      .createQueryBuilder("acl")
      .leftJoinAndSelect("acl.user", "u")
      .leftJoinAndSelect("acl.vehicle", "v")
      .leftJoinAndSelect("v.model", "m")
      .leftJoinAndSelect("m.brand", "b")
      .orderBy("acl.startTime", "DESC");

    // Apply search filter across user and vehicle information
    if (search) {
      applySearchFilter(qb, search, [
        "u.firstName",
        "u.lastName",
        "u.email",
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
      permission: { field: "acl.permission" },
    });

    // Handle activeAt filter separately (complex condition)
    if (filters?.activeAt) {
      qb.andWhere("acl.start_time <= :activeAt", {
        activeAt: filters.activeAt,
      });
      qb.andWhere("(acl.end_time IS NULL OR acl.end_time > :activeAt)", {
        activeAt: filters.activeAt,
      });
    }

    qb.take(resolvedLimit);
    qb.skip(resolvedOffset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { user: true, vehicle: true },
    });
  }

  /**
   * Get all active ACLs for a user at a specific point in time
   */
  async getActiveACLsForUser(
    userId: string,
    at: Date = new Date(),
  ): Promise<VehicleACLEntity[]> {
    const [acls] = await this.findAndCount({
      filters: { userId, activeAt: at },
    });
    return acls;
  }

  /**
   * Check if user has at least the required permission for a vehicle at a specific time
   */
  async hasPermission(
    userId: string,
    vehicleId: string,
    requiredPermission: PermissionType,
    at: Date = new Date(),
  ): Promise<boolean> {
    const [acls] = await this.findAndCount({
      filters: { userId, vehicleId, activeAt: at },
    });

    const requiredWeight = PERMISSION_WEIGHT[requiredPermission];
    return acls.some(
      (acl) => PERMISSION_WEIGHT[acl.permission] >= requiredWeight,
    );
  }

  create(data: Partial<VehicleACLEntity>) {
    return this.repo.create(data);
  }

  save(entity: VehicleACLEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
