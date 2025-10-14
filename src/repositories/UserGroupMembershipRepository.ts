import { DataSource, Repository } from "typeorm";
import { UserGroupMembership as UserGroupMembershipEntity } from "../entities/authorization/UserGroupMembership";

export interface UserGroupMembershipSearchParams {
  userId?: string;
  userGroupId?: string;
}

export class UserGroupMembershipRepository {
  private readonly repo: Repository<UserGroupMembershipEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserGroupMembershipEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: UserGroupMembershipSearchParams;
  }): Promise<[UserGroupMembershipEntity[], number]> {
    const { searchParams, limit, offset } = options || {};
    const qb = this.repo
      .createQueryBuilder("ugm")
      .leftJoinAndSelect("ugm.user", "u")
      .leftJoinAndSelect("ugm.userGroup", "ug")
      .orderBy("ugm.startTime", "DESC");

    if (searchParams) {
      if (searchParams.userId) {
        qb.andWhere("u.id = :userId", { userId: searchParams.userId });
      }
      if (searchParams.userGroupId) {
        qb.andWhere("ug.id = :userGroupId", { userGroupId: searchParams.userGroupId });
      }
    }

    if (typeof limit === "number") qb.take(limit);
    if (typeof offset === "number") qb.skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { user: true, userGroup: true },
    });
  }

  create(data: Partial<UserGroupMembershipEntity>) {
    return this.repo.create(data);
  }

  save(entity: UserGroupMembershipEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
