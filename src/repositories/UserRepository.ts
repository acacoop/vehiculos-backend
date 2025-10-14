import { DataSource, ILike, Repository } from "typeorm";
import { User as UserEntity } from "../entities/User";
import {
  IUserRepository,
  FindOptions,
  UserSearchParams,
} from "./interfaces/IUserRepository";

// Re-export types for convenience
export type { UserSearchParams, FindOptions };

export class UserRepository implements IUserRepository {
  private readonly repo: Repository<UserEntity>;

  constructor(ds: DataSource) {
    this.repo = ds.getRepository(UserEntity);
  }

  async findAndCount(opts?: FindOptions): Promise<[UserEntity[], number]> {
    const { searchParams } = opts || {};
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
    return this.repo.findAndCount({
      where,
      take: opts?.limit,
      skip: opts?.offset,
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
