import { DataSource, Repository } from "typeorm";
import { UserGroupNesting as UserGroupNestingEntity } from "../entities/authorization/UserGroupNesting";

export interface UserGroupNestingSearchParams {
  parentGroupId?: string;
  childGroupId?: string;
}

export class UserGroupNestingRepository {
  private readonly repo: Repository<UserGroupNestingEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserGroupNestingEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: UserGroupNestingSearchParams;
  }): Promise<[UserGroupNestingEntity[], number]> {
    const { searchParams, limit, offset } = options || {};
    const qb = this.repo
      .createQueryBuilder("ugn")
      .leftJoinAndSelect("ugn.parentGroup", "pg")
      .leftJoinAndSelect("ugn.childGroup", "cg")
      .orderBy("ugn.startTime", "DESC");

    if (searchParams) {
      if (searchParams.parentGroupId) {
        qb.andWhere({ "pg.id": searchParams.parentGroupId });
      }
      if (searchParams.childGroupId) {
        qb.andWhere({ "cg.id": searchParams.childGroupId });
      }
    }

    if (typeof limit === "number") qb.take(limit);
    if (typeof offset === "number") qb.skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { parentGroup: true, childGroup: true },
    });
  }

  create(data: Partial<UserGroupNestingEntity>) {
    return this.repo.create(data);
  }

  save(entity: UserGroupNestingEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
