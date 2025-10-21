import {
  IVehicleModelRepository,
  VehicleModelFilters,
} from "@/repositories/interfaces/IVehicleModelRepository";
import { IVehicleBrandRepository } from "@/repositories/interfaces/IVehicleBrandRepository";
import type { VehicleModelInput, VehicleModelType } from "@/schemas/vehicleModel";
import { AppError } from "@/middleware/errorHandler";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

/**
 */
export class VehicleModelService {
  constructor(
    private readonly repo: IVehicleModelRepository,
    private readonly brandRepo: IVehicleBrandRepository,
  ) {}

  async getAll(
    options?: RepositoryFindOptions<VehicleModelFilters>,
  ): Promise<{ items: VehicleModelType[]; total: number }> {
    const [rows, total] = await this.repo.findAndCount(options);
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
    const brand = await this.brandRepo.findOneByWhere({ id: data.brandId });
    if (!brand) {
      throw new AppError(
        `Brand with ID ${data.brandId} not found`,
        404,
        "https://example.com/problems/vehicle-brand-not-found",
        "Vehicle Brand Not Found",
      );
    }
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
    data: Partial<VehicleModelInput>,
  ): Promise<VehicleModelType | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (data.name) existing.name = data.name;
    if (data.brandId) {
      const brand = await this.brandRepo.findOneByWhere({ id: data.brandId });
      if (!brand) {
        throw new AppError(
          `Brand with ID ${data.brandId} not found`,
          404,
          "https://example.com/problems/vehicle-brand-not-found",
          "Vehicle Brand Not Found",
        );
      }
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
