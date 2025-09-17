import { AppDataSource } from "../../db";
import { Vehicle as VehicleEntity } from "../../entities/Vehicle";
import type { Vehicle } from "../../schemas/vehicle";
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

  async create(vehicle: Vehicle): Promise<Vehicle | null> {
    const created = this.vehicleRepo.create({
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      chassisNumber: vehicle.chassisNumber,
      engineNumber: vehicle.engineNumber,
      vehicleType: vehicle.vehicleType,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
    });
    const saved = await this.vehicleRepo.save(created);
    return mapEntity(saved);
  }

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle | null> {
    const existing = await this.vehicleRepo.findOne(id);
    if (!existing) return null;
    Object.assign(existing, {
      licensePlate: vehicle.licensePlate ?? existing.licensePlate,
      brand: vehicle.brand ?? existing.brand,
      model: vehicle.model ?? existing.model,
      year: vehicle.year ?? existing.year,
      chassisNumber: vehicle.chassisNumber ?? existing.chassisNumber,
      engineNumber: vehicle.engineNumber ?? existing.engineNumber,
      vehicleType: vehicle.vehicleType ?? existing.vehicleType,
      transmission: vehicle.transmission ?? existing.transmission,
      fuelType: vehicle.fuelType ?? existing.fuelType,
    });
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
    brand: e.brand,
    model: e.model,
    year: e.year,
    chassisNumber: e.chassisNumber,
    engineNumber: e.engineNumber,
    vehicleType: e.vehicleType,
    transmission: e.transmission,
    fuelType: e.fuelType,
  };
}

export default VehiclesService;
