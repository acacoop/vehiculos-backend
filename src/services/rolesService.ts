import { IRolesRepository } from "../repositories/interfaces/IRolesRepository";
import type { RoleInput, Role } from "../schemas/role";
import { CecoRange } from "../entities/Roles";

/**
 * RolesService - Business logic for Role operations
 * Uses Dependency Injection for better testability
 */
export class RolesService {
  constructor(private readonly repo: IRolesRepository) {}

  async getAll(options?: {
    limit?: number;
    offset?: number;
    searchParams?: Record<string, string>;
  }): Promise<{ items: Role[]; total: number }> {
    const { limit, offset, searchParams } = options || {};
    const [rows, total] = await this.repo.findAndCount({
      limit,
      offset,
      searchParams: { permission: searchParams?.permission },
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        permission: r.permission,
        cecoRanges: r.cecoRanges?.map((cr) => ({
          id: cr.id,
          startCeco: cr.startCeco,
          endCeco: cr.endCeco,
        })),
      })),
      total,
    };
  }

  async getById(id: string): Promise<Role | null> {
    const ent = await this.repo.findOne(id);
    if (!ent) return null;
    return {
      id: ent.id,
      permission: ent.permission,
      cecoRanges: ent.cecoRanges?.map((cr) => ({
        id: cr.id,
        startCeco: cr.startCeco,
        endCeco: cr.endCeco,
      })),
    };
  }

  async create(data: RoleInput): Promise<Role> {
    const entity = this.repo.create({ permission: data.permission });
    if (data.cecoRanges && data.cecoRanges.length) {
      entity.cecoRanges = data.cecoRanges.map((c) => {
        const cr = new CecoRange();
        cr.startCeco = c.startCeco;
        cr.endCeco = c.endCeco;
        return cr;
      });
    }

    const saved = await this.repo.save(entity);
    return {
      id: saved.id,
      permission: saved.permission,
      cecoRanges: saved.cecoRanges?.map((cr) => ({
        id: cr.id,
        startCeco: cr.startCeco,
        endCeco: cr.endCeco,
      })),
    };
  }

  async update(id: string, data: Partial<RoleInput>): Promise<Role | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (data.permission) existing.permission = data.permission;

    if (data.cecoRanges) {
      // replace cecoRanges with provided list
      existing.cecoRanges = data.cecoRanges.map((c) => {
        const cr = new CecoRange();
        if (c.id) cr.id = c.id;
        cr.startCeco = c.startCeco;
        cr.endCeco = c.endCeco;
        return cr;
      });
    }

    const saved = await this.repo.save(existing);
    return {
      id: saved.id,
      permission: saved.permission,
      cecoRanges: saved.cecoRanges?.map((cr) => ({
        id: cr.id,
        startCeco: cr.startCeco,
        endCeco: cr.endCeco,
      })),
    };
  }

  async delete(id: string) {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}

export default RolesService;
