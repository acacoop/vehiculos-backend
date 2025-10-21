import { User as UserEntity } from "@/entities/User";
import type { User } from "@/schemas/user";
import {
  IUserRepository,
  UserFilters,
} from "@/repositories/interfaces/IUserRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

/**
 */
export class UsersService {
  constructor(private readonly userRepo: IUserRepository) {}

  async getAll(
    options?: RepositoryFindOptions<UserFilters>,
  ): Promise<{ items: User[]; total: number }> {
    const [entities, total] = await this.userRepo.findAndCount(options);
    return { items: entities, total };
  }

  async getById(id: string): Promise<UserEntity | null> {
    return await this.userRepo.findOne(id);
  }

  async getByEntraId(entraId: string): Promise<UserEntity | null> {
    return await this.userRepo.findByEntraId(entraId);
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepo.findByEmail(email);
  }

  async getByCuit(cuit: string): Promise<UserEntity | null> {
    return await this.userRepo.findByCuit(cuit);
  }

  async create(user: User): Promise<UserEntity | null> {
    const created = this.userRepo.create({
      firstName: user.firstName,
      lastName: user.lastName,
      cuit: user.cuit,
      email: user.email,
      active: user.active ?? true,
      entraId: user.entraId || "",
    });
    return await this.userRepo.save(created);
  }

  async update(id: string, user: Partial<User>): Promise<UserEntity | null> {
    const existing = await this.userRepo.findOne(id);
    if (!existing) return null;
    Object.assign(existing, {
      firstName: user.firstName ?? existing.firstName,
      lastName: user.lastName ?? existing.lastName,
      cuit: user.cuit ?? existing.cuit,
      email: user.email ?? existing.email,
      active: user.active ?? existing.active,
    });
    if (user.entraId !== undefined) existing.entraId = user.entraId || "";
    return await this.userRepo.save(existing);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.userRepo.delete(id);
    return res.affected === 1;
  }

  async activate(id: string): Promise<UserEntity | null> {
    const existing = await this.userRepo.findOne(id);
    if (!existing) return null;
    if (existing.active) throw new Error("ALREADY_ACTIVE");
    existing.active = true;
    return await this.userRepo.save(existing);
  }

  async deactivate(id: string): Promise<UserEntity | null> {
    const existing = await this.userRepo.findOne(id);
    if (!existing) return null;
    if (!existing.active) throw new Error("ALREADY_INACTIVE");
    existing.active = false;
    return await this.userRepo.save(existing);
  }
}

export default UsersService;
