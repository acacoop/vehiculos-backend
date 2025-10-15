import { DataSource, ILike, Repository } from "typeorm";
import { User as UserEntity } from "../entities/User";
import {
  IUserRepository,
  UserSearchParams,
} from "./interfaces/IUserRepository";
import { RepositoryFindOptions, resolvePagination } from "./interfaces/common";

// Re-export types for convenience
export type { UserSearchParams };

export class UserRepository implements IUserRepository {
  private readonly repo: Repository<UserEntity>;

  constructor(ds: DataSource) {
    this.repo = ds.getRepository(UserEntity);
  }

  async findAndCount(
    opts?: RepositoryFindOptions<UserSearchParams>,
  ): Promise<[UserEntity[], number]> {
    const { searchParams, pagination } = opts || {};
    const where: Record<string, unknown> = {};
    if (searchParams) {
      if (searchParams.email) where.email = searchParams.email;
      if (searchParams.cuit) where.cuit = Number(searchParams.cuit);
      if (searchParams.firstName)
        where.firstName = ILike(`%${searchParams.firstName}%`);
      if (searchParams.lastName)
        where.lastName = ILike(`%${searchParams.lastName}%`);
      if (searchParams.active !== undefined)
        where.active = searchParams.active === "true";
    }
    const { limit, offset } = resolvePagination(pagination);
    return this.repo.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { lastName: "ASC" },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  findByEntraId(entraId: string) {
    return this.repo.findOne({ where: { entraId } });
  }
  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }
  findByCuit(cuit: string) {
    return this.repo.findOne({ where: { cuit } });
  }
  create(data: Partial<UserEntity>) {
    return this.repo.create(data);
  }
  save(entity: UserEntity) {
    return this.repo.save(entity);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
}
