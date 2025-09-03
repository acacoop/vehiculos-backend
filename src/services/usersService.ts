import { AppDataSource } from "../db";
import { User as UserEntity } from "../entities/User";
import type { User } from "../schemas/user";
import { UserRepository } from "../repositories/UserRepository";

export class UsersService {
  constructor(private readonly userRepo = new UserRepository(AppDataSource)) {}

  async getAll(options?: {
    limit?: number;
    offset?: number;
    searchParams?: Record<string, string>;
  }): Promise<{ items: User[]; total: number }> {
    const [entities, total] = await this.userRepo.findAndCount(options);
    return { items: entities.map(mapEntity), total };
  }

  async getById(id: string): Promise<User | null> {
    const ent = await this.userRepo.findOne(id);
    return ent ? mapEntity(ent) : null;
  }

  async getByEntraId(entraId: string): Promise<User | null> {
    const ent = await this.userRepo.findByEntraId(entraId);
    return ent ? mapEntity(ent) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const ent = await this.userRepo.findByEmail(email);
    return ent ? mapEntity(ent) : null;
  }

  async getByCuit(cuit: number): Promise<User | null> {
    const ent = await this.userRepo.findByCuit(cuit);
    return ent ? mapEntity(ent) : null;
  }

  async create(user: User): Promise<User | null> {
    const created = this.userRepo.create({
      firstName: user.firstName,
      lastName: user.lastName,
      cuit: user.cuit,
      email: user.email,
      active: user.active ?? true,
      entraId: user.entraId || "",
    });
    const saved = await this.userRepo.save(created);
    return mapEntity(saved);
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
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
    const saved = await this.userRepo.save(existing);
    return mapEntity(saved);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.userRepo.delete(id);
    return res.affected === 1;
  }

  async activate(id: string): Promise<User | null> {
    const existing = await this.userRepo.findOne(id);
    if (!existing) return null;
    if (existing.active) throw new Error("ALREADY_ACTIVE");
    existing.active = true;
    const saved = await this.userRepo.save(existing);
    return mapEntity(saved);
  }

  async deactivate(id: string): Promise<User | null> {
    const existing = await this.userRepo.findOne(id);
    if (!existing) return null;
    if (!existing.active) throw new Error("ALREADY_INACTIVE");
    existing.active = false;
    const saved = await this.userRepo.save(existing);
    return mapEntity(saved);
  }
}

function mapEntity(e: UserEntity): User {
  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    cuit: e.cuit,
    email: e.email,
    active: e.active,
    entraId: e.entraId || "",
  };
}

export default UsersService;
