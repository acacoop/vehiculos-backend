import { DataSource, Repository } from "typeorm";
import { User as UserEntity } from "entities/User";
import { IUserRepository, UserFilters } from "./interfaces/IUserRepository";
import { RepositoryFindOptions, resolvePagination } from "./interfaces/common";
import { applySearchFilter, applyFilters } from "utils";

// Re-export types for convenience
export type { UserFilters };

export class UserRepository implements IUserRepository {
  private readonly repo: Repository<UserEntity>;

  constructor(ds: DataSource) {
    this.repo = ds.getRepository(UserEntity);
  }

  async findAndCount(
    opts?: RepositoryFindOptions<UserFilters>,
  ): Promise<[UserEntity[], number]> {
    const { filters, search, pagination } = opts || {};
    const qb = this.repo.createQueryBuilder("u").orderBy("u.lastName", "ASC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, [
        "u.firstName",
        "u.lastName",
        "u.email",
        "u.cuit",
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      email: { field: "u.email" },
      cuit: { field: "u.cuit", transform: (v) => Number(v) },
      firstName: { field: "u.firstName", operator: "LIKE" },
      lastName: { field: "u.lastName", operator: "LIKE" },
      active: { field: "u.active", transform: (v) => v === "true" },
    });

    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit).skip(offset);

    return qb.getManyAndCount();
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
