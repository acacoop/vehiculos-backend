import { AppDataSource } from "../db";
import { VehicleModelRepository } from "../repositories/VehicleModelRepository";
import { VehicleBrand } from "../entities/VehicleBrand";
import type {
  VehicleModelInput,
  VehicleModelType,
} from "../schemas/vehicleModel";

export class VehicleModelService {
  constructor(
    private readonly repo = new VehicleModelRepository(AppDataSource)
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
        vehicleType: r.vehicleType ?? undefined,
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
          vehicleType: ent.vehicleType ?? undefined,
          brand: { id: ent.brand.id, name: ent.brand.name },
        }
      : null;
  }

  async create(data: VehicleModelInput): Promise<VehicleModelType | null> {
    const brandRepo = AppDataSource.getRepository(VehicleBrand);
    const brand = await brandRepo.findOne({ where: { id: data.brandId } });
    if (!brand) return null;
    const created = this.repo.create({
      name: data.name,
      brand,
      vehicleType: data.vehicleType ?? undefined,
    });
    const saved = await this.repo.save(created);
    return {
      id: saved.id,
      name: saved.name,
      vehicleType: saved.vehicleType ?? undefined,
      brand: { id: brand.id, name: brand.name },
    };
  }

  async update(
    id: string,
    data: Partial<VehicleModelInput>
  ): Promise<VehicleModelType | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (data.name) existing.name = data.name;
    if (data.brandId) {
      const brand = await AppDataSource.getRepository(VehicleBrand).findOne({
        where: { id: data.brandId },
      });
      if (!brand) return null;
      existing.brand = brand;
    }
    if ("vehicleType" in data)
      existing.vehicleType = data.vehicleType ?? undefined;
    const saved = await this.repo.save(existing);
    return {
      id: saved.id,
      name: saved.name,
      vehicleType: saved.vehicleType ?? undefined,
      brand: { id: saved.brand.id, name: saved.brand.name },
    };
  }

  async delete(id: string) {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}

export default VehicleModelService;
