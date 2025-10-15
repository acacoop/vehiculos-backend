import { Repository, DataSource } from "typeorm";
import { UserRole } from "../entities/UserRole";
import { UserRoleEnum } from "../utils/common";

export interface UserRoleSearchParams {
  userId?: string;
  role?: UserRoleEnum;
  activeOnly?: boolean;
}

export class UserRoleRepository {
  private readonly repo: Repository<UserRole>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserRole);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: UserRoleSearchParams;
  }): Promise<[UserRole[], number]> {
    const qb = this.repo
      .createQueryBuilder("ur")
      .leftJoinAndSelect("ur.user", "user");

    if (options?.searchParams) {
      const { userId, role, activeOnly } = options.searchParams;

      if (userId) {
        qb.andWhere("user.id = :userId", { userId });
      }

      if (role) {
        qb.andWhere("ur.role = :role", { role });
      }

      if (activeOnly) {
        qb.andWhere("ur.startTime <= :now", { now: new Date() }).andWhere(
          "(ur.endTime IS NULL OR ur.endTime > :now)",
          { now: new Date() },
        );
      }
    }

    if (options?.limit) {
      qb.take(options.limit);
    }

    if (options?.offset) {
      qb.skip(options.offset);
    }

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
    const now = new Date();
    const count = await this.repo
      .createQueryBuilder("ur")
      .where("ur.user_id = :userId", { userId })
      .andWhere("ur.role = :role", { role })
      .andWhere("ur.start_time <= :now", { now })
      .andWhere("(ur.end_time IS NULL OR ur.end_time >= :now)", { now })
      .getCount();
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
}
