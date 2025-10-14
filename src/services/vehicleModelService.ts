import { IVehicleModelRepository } from "../repositories/interfaces/IVehicleModelRepository";
import { IVehicleBrandRepository } from "../repositories/interfaces/IVehicleBrandRepository";
import type {
  VehicleModelInput,
  VehicleModelType,
} from "../schemas/vehicleModel";

/**
 * VehicleModelService - Business logic for VehicleModel operations
 * Now uses Dependency Injection for better testability
 */
export class VehicleModelService {
  constructor(
    private readonly repo: IVehicleModelRepository,
    private readonly brandRepo: IVehicleBrandRepository,
  ) {}

  async getAll(options?: {
    limit?: number;
    offset?: number;
    searchParams?: Record<string, string>;
  }): Promise<{ items: VehicleModelType[]; total: number }> {
    const { limit, offset, searchParams } = options || {};
    const [rows, total] = await this.repo.findAndCount({
      limit,
      offset,
      searchParams: {
        name: searchParams?.name,
        brandId: searchParams?.brandId,
      },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        brand: { id: r.brand.id, name: r.brand.name },
      })),
      total,
    };
  }

  async getById(id: string): Promise<VehicleModelType | null> {
    const ent = await this.repo.findOne(id);
    return ent
      ? {
          id: ent.id,
          name: ent.name,
          brand: { id: ent.brand.id, name: ent.brand.name },
        }
      : null;
  }

  async create(data: VehicleModelInput): Promise<VehicleModelType | null> {
    const brand = await this.brandRepo.findOneByWhere({ id: data.brandId });
    if (!brand) return null;
    const created = this.repo.create({ name: data.name, brand });
    const saved = await this.repo.save(created);
    return {
      id: saved.id,
      name: saved.name,
      brand: { id: brand.id, name: brand.name },
    };
  }

  async update(
    id: string,
    data: Partial<VehicleModelInput>,
  ): Promise<VehicleModelType | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (data.name) existing.name = data.name;
    if (data.brandId) {
      const brand = await this.brandRepo.findOneByWhere({ id: data.brandId });
      if (!brand) return null;
      existing.brand = brand;
    }
    const saved = await this.repo.save(existing);
    return {
      id: saved.id,
      name: saved.name,
      brand: { id: saved.brand.id, name: saved.brand.name },
    };
  }

  async delete(id: string) {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}

export default VehicleModelService;
