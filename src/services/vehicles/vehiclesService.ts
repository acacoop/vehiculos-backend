import { AppDataSource } from "../../db";
import { Vehicle as VehicleEntity } from "../../entities/Vehicle";
import { VehicleModel } from "../../entities/VehicleModel";
import type {
  Vehicle,
  VehicleInput,
  VehicleUpdate,
} from "../../schemas/vehicle";
import VehicleResponsiblesService from "../vehicleResponsiblesService";
import { VehicleRepository } from "../../repositories/VehicleRepository";

export class VehiclesService {
  constructor(
    private readonly vehicleRepo = new VehicleRepository(AppDataSource),
    private readonly responsiblesService = new VehicleResponsiblesService()
  ) {}

  async getAll(options?: {
    limit?: number;
    offset?: number;
    searchParams?: Record<string, string>;
  }): Promise<{ items: Vehicle[]; total: number }> {
    const [entities, total] = await this.vehicleRepo.findAndCount(options);
    return { items: entities.map(mapEntity), total };
  }

  async getById(
    id: string
  ): Promise<(Vehicle & { currentResponsible?: unknown }) | null> {
    const entity = await this.vehicleRepo.findOne(id);
    if (!entity) return null;
    const currentResponsible =
      await this.responsiblesService.getCurrentForVehicle(id);
    return {
      ...mapEntity(entity),
      currentResponsible: currentResponsible ?? undefined,
    };
  }

  async create(input: VehicleInput): Promise<Vehicle | null> {
    const modelRepo = AppDataSource.getRepository(VehicleModel);
    const model = await modelRepo.findOne({
      where: { id: input.modelId },
      relations: { brand: true },
    });
    if (!model) return null;
    const created = this.vehicleRepo.create({
      licensePlate: input.licensePlate,
      model,
      year: input.year,
      chassisNumber: input.chassisNumber,
      engineNumber: input.engineNumber,
      vehicleType: input.vehicleType,
      transmission: input.transmission,
      fuelType: input.fuelType,
    });

    const saved = await this.vehicleRepo.save(created);
    return mapEntity(saved);
  }

  async update(id: string, data: VehicleUpdate): Promise<Vehicle | null> {
    const existing = await this.vehicleRepo.findOne(id);
    if (!existing) return null;
    if (data.modelId) {
      const model = await AppDataSource.getRepository(VehicleModel).findOne({
        where: { id: data.modelId },
        relations: { brand: true },
      });
      if (!model) return null;
      existing.model = model;
    }
    if (data.licensePlate) existing.licensePlate = data.licensePlate;
    if (typeof data.year === "number") existing.year = data.year;
    if ("chassisNumber" in data)
      existing.chassisNumber = data.chassisNumber ?? undefined;
    if ("engineNumber" in data)
      existing.engineNumber = data.engineNumber ?? undefined;
    if ("vehicleType" in data)
      existing.vehicleType = data.vehicleType ?? undefined;
    if ("transmission" in data)
      existing.transmission = data.transmission ?? undefined;
    if ("fuelType" in data) existing.fuelType = data.fuelType ?? undefined;
    const saved = await this.vehicleRepo.save(existing);
    return mapEntity(saved);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.vehicleRepo.delete(id);
    return res.affected === 1;
  }
}

// Helper to map entity -> domain type
function mapEntity(e: VehicleEntity): Vehicle {
  return {
    id: e.id,
    licensePlate: e.licensePlate,
    year: e.year,
    chassisNumber: e.chassisNumber ?? undefined,
    engineNumber: e.engineNumber ?? undefined,
    vehicleType: e.vehicleType ?? undefined,
    transmission: e.transmission ?? undefined,
    fuelType: e.fuelType ?? undefined,
    model: {
      id: e.model.id,
      name: e.model.name,
      brand: { id: e.model.brand.id, name: e.model.brand.name },
    },
  } as Vehicle;
}

export default VehiclesService;
