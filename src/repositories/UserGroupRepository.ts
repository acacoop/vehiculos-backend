import { DataSource, Repository } from "typeorm";
import { UserGroup as UserGroupEntity } from "../entities/UserGroup";

export class UserGroupRepository {
  private readonly repo: Repository<UserGroupEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserGroupEntity);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
  }): Promise<[UserGroupEntity[], number]> {
    return this.repo.findAndCount({
      take: options?.limit,
      skip: options?.offset,
      order: { id: "ASC" },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<UserGroupEntity>) {
    return this.repo.create(data);
  }

  save(entity: UserGroupEntity) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
