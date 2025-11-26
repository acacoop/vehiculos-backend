import { Repository, DataSource } from "typeorm";
import { UserRole } from "@/entities/UserRole";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import {
  UserRoleFilters,
  IUserRoleRepository,
} from "@/repositories/interfaces/IUserRoleRepository";
import {
  applySearchFilter,
  applyFilters,
  applyActiveFilter,
} from "@/utils/query/helpers";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";

export class UserRoleRepository implements IUserRoleRepository {
  private readonly repo: Repository<UserRole>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserRole);
  }

  async findAndCount(
    opts?: RepositoryFindOptions<UserRoleFilters>,
  ): Promise<[UserRole[], number]> {
    const { pagination, filters, search } = opts || {};
    const { limit, offset } = resolvePagination(pagination);

    const qb = this.repo
      .createQueryBuilder("ur")
      .leftJoinAndSelect("ur.user", "user");

    // Apply search filter across user information
    if (search) {
      applySearchFilter(qb, search, [
        "user.firstName",
        "user.lastName",
        "user.email",
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      userId: { field: "user.id" },
      role: { field: "ur.role" },
    });

    // Apply active filter
    if (filters?.active) {
      applyActiveFilter(qb, undefined, "ur.startTime", "ur.endTime");
    }

    qb.take(limit);
    qb.skip(offset);
    qb.orderBy("ur.startTime", "DESC");

    return await qb.getManyAndCount();
  }

  async findOne(id: string): Promise<UserRole | null> {
    return await this.repo.findOne({
      where: { id },
      relations: ["user"],
    });
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    return await this.repo.find({
      where: { user: { id: userId } },
      relations: ["user"],
      order: { startTime: "DESC" },
    });
  }

  async findActiveByUserId(userId: string): Promise<UserRole | null> {
    const now = new Date();
    const roles = await this.repo.find({
      where: { user: { id: userId } },
      relations: ["user"],
      order: { startTime: "DESC" },
    });

    return (
      roles.find(
        (role) =>
          role.startTime <= now && (!role.endTime || role.endTime > now),
      ) || null
    );
  }

  async hasActiveRole(userId: string, role: UserRoleEnum): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder("ur")
      .where("ur.user.id = :userId", { userId })
      .andWhere("ur.role = :role", { role });
    applyActiveFilter(qb, undefined, "ur.startTime", "ur.endTime");
    const count = await qb.getCount();
    return count > 0;
  }

  create(data: Partial<UserRole>): UserRole {
    return this.repo.create(data);
  }

  async save(role: UserRole): Promise<UserRole> {
    return await this.repo.save(role);
  }

  async saveMany(roles: UserRole[]): Promise<UserRole[]> {
    return await this.repo.save(roles);
  }

  async delete(id: string): Promise<{ affected?: number }> {
    const result = await this.repo.delete(id);
    return { affected: result.affected || 0 };
  }

  async endRole(id: string, endTime?: Date): Promise<UserRole | null> {
    const role = await this.findOne(id);
    if (!role) return null;

    role.endTime = endTime || new Date();
    return await this.save(role);
  }

  qb() {
    return this.repo.createQueryBuilder("ur");
  }
}
