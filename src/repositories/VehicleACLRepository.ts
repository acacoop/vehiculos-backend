import { DataSource, Repository } from "typeorm";
import { VehicleACL as VehicleACLEntity } from "@/entities/VehicleACL";
import { PermissionType, PERMISSION_WEIGHT } from "@/enums/PermissionType";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";
import {
  VehicleACLFilters,
  IVehicleACLRepository,
} from "@/repositories/interfaces/IVehicleACLRepository";

export class VehicleACLRepository implements IVehicleACLRepository {
  private readonly repo: Repository<VehicleACLEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleACLEntity);
  }

  async findAndCount(
    options?: RepositoryFindOptions<VehicleACLFilters>,
  ): Promise<[VehicleACLEntity[], number]> {
    const { filters, search, pagination } = options || {};
    const { limit, offset } = resolvePagination(pagination);

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

    // Apply active filter
    if (filters?.active) {
      qb.andWhere("acl.start_time <= :activeDate", {
        activeDate: new Date().toISOString().split("T")[0],
      });
      qb.andWhere("(acl.end_time IS NULL OR acl.end_time > :activeDate)", {
        activeDate: new Date().toISOString().split("T")[0],
      });
    }

    qb.take(limit);
    qb.skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { user: true, vehicle: true },
    });
  }

  /**
   * Get all active ACLs for a user
   */
  async getActiveACLsForUser(userId: string): Promise<VehicleACLEntity[]> {
    const [acls] = await this.findAndCount({
      filters: { userId, active: true },
    });
    return acls;
  }

  /**
   * Check if user has at least the required permission for a vehicle
   */
  async hasPermission(
    userId: string,
    vehicleId: string,
    requiredPermission: PermissionType,
  ): Promise<boolean> {
    const [acls] = await this.findAndCount({
      filters: { userId, vehicleId, active: true },
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

  async delete(id: string): Promise<{ affected?: number }> {
    const result = await this.repo.delete(id);
    return { affected: result.affected || 0 };
  }
}
