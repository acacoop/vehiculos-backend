import {
  IVehicleBrandRepository,
  VehicleBrandSearchParams,
} from "../repositories/interfaces/IVehicleBrandRepository";
import type { VehicleBrandInput, VehicleBrand } from "../schemas/vehicleBrand";
import { RepositoryFindOptions } from "../repositories/interfaces/common";

/**
 * VehicleBrandService - Business logic for VehicleBrand operations
 * Now uses Dependency Injection for better testability
 */
export class VehicleBrandService {
  constructor(private readonly repo: IVehicleBrandRepository) {}

  async getAll(
    options?: RepositoryFindOptions<VehicleBrandSearchParams>,
  ): Promise<{ items: VehicleBrand[]; total: number }> {
    const [rows, total] = await this.repo.findAndCount(options);
    return { items: rows.map((r) => ({ id: r.id, name: r.name })), total };
  }

  async getById(id: string): Promise<VehicleBrand | null> {
    const ent = await this.repo.findOne(id);
    return ent ? { id: ent.id, name: ent.name } : null;
  }

  async create(data: VehicleBrandInput): Promise<VehicleBrand | null> {
    const created = this.repo.create({ name: data.name });
    const saved = await this.repo.save(created);
    return { id: saved.id, name: saved.name };
  }

  async update(
    id: string,
    data: Partial<VehicleBrandInput>,
  ): Promise<VehicleBrand | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (data.name) existing.name = data.name;
    const saved = await this.repo.save(existing);
    return { id: saved.id, name: saved.name };
  }

  async delete(id: string) {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}

export default VehicleBrandService;
