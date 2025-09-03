import { DataSource, ILike, Repository } from "typeorm";
import { User as UserEntity } from "../entities/User";

export interface UserSearchParams {
  email?: string;
  dni?: string; // raw from query
  firstName?: string;
  lastName?: string;
  active?: string; // 'true' | 'false'
}

export class UserRepository {
  private readonly repo: Repository<UserEntity>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(UserEntity);
  }

  async findAndCount(opts?: {
    limit?: number;
    offset?: number;
    searchParams?: UserSearchParams;
  }): Promise<[UserEntity[], number]> {
    const { searchParams } = opts || {};
    const where: Record<string, unknown> = {};
    if (searchParams) {
      if (searchParams.email) where.email = searchParams.email;
      if (searchParams.dni) where.dni = Number(searchParams.dni);
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
