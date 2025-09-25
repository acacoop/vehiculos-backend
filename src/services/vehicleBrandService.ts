import { AppDataSource } from "../db";
import { VehicleBrandRepository } from "../repositories/VehicleBrandRepository";
import type { VehicleBrandInput, VehicleBrand } from "../schemas/vehicleBrand";

export class VehicleBrandService {
  constructor(
    private readonly repo = new VehicleBrandRepository(AppDataSource)
  ) {}

  async getAll(options?: {
    limit?: number;
    offset?: number;
    searchParams?: Record<string, string>;
  }): Promise<{ items: VehicleBrand[]; total: number }> {
    const { limit, offset, searchParams } = options || {};
    const [rows, total] = await this.repo.findAndCount({
      limit,
      offset,
      searchParams: { name: searchParams?.name },
    });
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
    data: Partial<VehicleBrandInput>
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
