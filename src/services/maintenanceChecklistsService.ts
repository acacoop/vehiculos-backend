import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";
import {
  IMaintenanceChecklistRepository,
  MaintenanceChecklistFilters,
} from "@/repositories/interfaces/IMaintenanceChecklistRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import type {
  MaintenanceChecklistDTO,
  MaintenanceChecklist as MaintenanceChecklistSchema,
} from "@/schemas/maintenanceChecklist";
import { validateVehicleExists } from "@/utils/validation/entity";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { Repository } from "typeorm";

function map(mc: MaintenanceChecklist): MaintenanceChecklistDTO {
  return {
    id: mc.id,
    vehicle: {
      id: mc.vehicle.id,
      licensePlate: mc.vehicle.licensePlate,
      year: mc.vehicle.year,
      chassisNumber: mc.vehicle.chassisNumber ?? undefined,
      engineNumber: mc.vehicle.engineNumber ?? undefined,
      transmission: mc.vehicle.transmission ?? undefined,
      fuelType: mc.vehicle.fuelType ?? undefined,
      model: {
        id: mc.vehicle.model.id,
        name: mc.vehicle.model.name,
        vehicleType: mc.vehicle.model.vehicleType ?? undefined,
        brand: {
          id: mc.vehicle.model.brand.id,
          name: mc.vehicle.model.brand.name,
        },
      },
    },
    year: mc.year,
    quarter: mc.quarter,
    intendedDeliveryDate: mc.intendedDeliveryDate,
    filledBy: mc.filledBy
      ? {
          id: mc.filledBy.id,
          firstName: mc.filledBy.firstName,
          lastName: mc.filledBy.lastName,
          cuit: mc.filledBy.cuit,
          email: mc.filledBy.email,
          entraId: mc.filledBy.entraId,
          active: mc.filledBy.active,
        }
      : undefined,
    filledAt: mc.filledAt ?? undefined,
    itemCount: (mc as any).itemCount || 0,
    passedCount: (mc as any).passedCount || 0,
  };
}

export class MaintenanceChecklistsService {
  constructor(
    private readonly repository: IMaintenanceChecklistRepository,
    private readonly userRepo: Repository<User>,
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async getAll(
    options: RepositoryFindOptions<Partial<MaintenanceChecklistFilters>>,
  ): Promise<{ items: MaintenanceChecklistDTO[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount(options);
    const items = entities.map(map);
    return { items, total };
  }

  async getById(id: string): Promise<MaintenanceChecklistDTO | null> {
    const entity = await this.repository.findOne(id);
    return entity ? map(entity) : null;
  }

  async create(
    data: MaintenanceChecklistSchema,
  ): Promise<MaintenanceChecklistDTO> {
    await validateVehicleExists(data.vehicleId);

    const vehicle = await this.vehicleRepo.findOne({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");

    const filledBy = data.filledBy
      ? await this.userRepo.findOne({ where: { id: data.filledBy } })
      : null;

    const entityData: Partial<MaintenanceChecklist> = {
      vehicle,
      year: data.year,
      quarter: data.quarter,
      intendedDeliveryDate: data.intendedDeliveryDate,
      filledBy,
      filledAt: data.filledAt,
    };

    const entity = this.repository.create(entityData);
    const saved = await this.repository.save(entity);
    return map(saved);
  }

  async update(
    id: string,
    data: Partial<MaintenanceChecklistSchema>,
  ): Promise<MaintenanceChecklistDTO | null> {
    const existing = await this.repository.findOne(id);
    if (!existing) return null;

    if (data.vehicleId) {
      await validateVehicleExists(data.vehicleId);
      const vehicle = await this.vehicleRepo.findOne({
        where: { id: data.vehicleId },
      });
      if (!vehicle) throw new Error("Vehicle not found");
      existing.vehicle = vehicle;
    }

    if (data.year !== undefined) existing.year = data.year;
    if (data.quarter !== undefined) existing.quarter = data.quarter;
    if (data.intendedDeliveryDate)
      existing.intendedDeliveryDate = data.intendedDeliveryDate;

    if (data.filledBy !== undefined) {
      existing.filledBy = data.filledBy
        ? (await this.userRepo.findOne({ where: { id: data.filledBy } })) ||
          null
        : null;
    }

    if (data.filledAt !== undefined) existing.filledAt = data.filledAt;

    const saved = await this.repository.save(existing);
    return map(saved);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
