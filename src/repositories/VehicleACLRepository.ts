import { DataSource, Repository } from "typeorm";
import { VehicleACL as VehicleACLEntity } from "../entities/authorization/VehicleACL";
import { PermissionType } from "../entities/authorization/PermissionType";
import { ACLType } from "../entities/authorization/VehicleACL";

export interface VehicleACLSearchParams {
  aclType?: ACLType;
  entityId?: string;
  permission?: PermissionType;
  vehicleSelectionId?: string;
}

export class VehicleACLRepository {
  private readonly repo: Repository<VehicleACLEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(VehicleACLEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: VehicleACLSearchParams;
  }): Promise<[VehicleACLEntity[], number]> {
    const { searchParams, limit, offset } = options || {};
    const qb = this.repo
      .createQueryBuilder("acl")
      .leftJoinAndSelect("acl.vehicleSelection", "vs")
      .orderBy("acl.startTime", "DESC");

    if (searchParams) {
      if (searchParams.aclType) {
        qb.andWhere({ "acl.aclType": searchParams.aclType });
      }
      if (searchParams.entityId) {
        qb.andWhere({ "acl.entityId": searchParams.entityId });
      }
      if (searchParams.permission) {
        qb.andWhere({ "acl.permission": searchParams.permission });
      }
      if (searchParams.vehicleSelectionId) {
        qb.andWhere({ "vs.id": searchParams.vehicleSelectionId });
      }
    }

    if (typeof limit === "number") qb.take(limit);
    if (typeof offset === "number") qb.skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { vehicleSelection: true },
    });
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
