import { DataSource, Repository } from "typeorm";
import { UserRole as UserRoleEntity } from "../entities/authorization/UserRole";
import { UserRoleEnum } from "../entities/authorization/UserRole";

export interface UserRoleSearchParams {
  userId?: string;
  role?: UserRoleEnum;
}

export class UserRoleRepository {
  private readonly repo: Repository<UserRoleEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserRoleEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: UserRoleSearchParams;
  }): Promise<[UserRoleEntity[], number]> {
    const { searchParams, limit, offset } = options || {};
    const qb = this.repo
      .createQueryBuilder("ur")
      .leftJoinAndSelect("ur.user", "u")
      .orderBy("ur.startTime", "DESC");

    if (searchParams) {
      if (searchParams.userId) {
        qb.andWhere({ "u.id": searchParams.userId });
      }
      if (searchParams.role) {
        qb.andWhere({ "ur.role": searchParams.role });
      }
    }

    if (typeof limit === "number") qb.take(limit);
    if (typeof offset === "number") qb.skip(offset);
    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  findCurrentRoleForUser(userId: string): Promise<UserRoleEntity | null> {
    const now = new Date();
    return this.repo
      .createQueryBuilder("ur")
      .leftJoinAndSelect("ur.user", "u")
      .where("u.id = :userId", { userId })
      .andWhere("ur.startTime <= :now", { now })
      .andWhere("(ur.endTime IS NULL OR ur.endTime > :now)", { now })
      .orderBy("ur.startTime", "DESC")
      .getOne();
  }

  create(data: Partial<UserRoleEntity>) {
    return this.repo.create(data);
  }

  save(entity: UserRoleEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
