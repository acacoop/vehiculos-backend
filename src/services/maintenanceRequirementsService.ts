import { MaintenanceRequirement as MaintenanceRequirementEntity } from "@/entities/MaintenanceRequirement";
import {
  IMaintenanceRequirementRepository,
  MaintenanceRequirementFilters,
} from "@/repositories/interfaces/IMaintenanceRequirementRepository";
import {
  validateMaintenanceExists,
  validateVehicleExists,
} from "@/utils/validation/entity";
import type { Vehicle as VehicleSchema } from "@/schemas/vehicle";
import type { Maintenance as MaintenanceSchemaType } from "@/schemas/maintenance";
import { Vehicle } from "@/entities/Vehicle";
import { Maintenance } from "@/entities/Maintenance";
import { Repository } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { AppError } from "@/middleware/errorHandler";

export interface MaintenanceRequirementDTO {
  id: string;
  vehicle: VehicleSchema;
  maintenance: MaintenanceSchemaType & {
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
    category: { name: string };
  };
  kilometersFrequency?: number;
  daysFrequency?: number;
  observations?: string;
  instructions?: string;
  startDate: string;
  endDate?: string;
}

export class MaintenanceRequirementsService {
  constructor(
    private readonly repo: IMaintenanceRequirementRepository,
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly maintenanceRepo: Repository<Maintenance>,
  ) {}

  async getAll(
    options?: RepositoryFindOptions<MaintenanceRequirementFilters>,
  ): Promise<{ items: MaintenanceRequirementDTO[]; total: number }> {
    const [entities, total] = await this.repo.findAndCount(options);
    return { items: entities.map((e) => this.map(e)), total };
  }

  map(mr: MaintenanceRequirementEntity): MaintenanceRequirementDTO {
    // Defensive checks for relations that might be undefined
    if (!mr.vehicle) {
      throw new Error(
        `MaintenanceRequirement ${mr.id} has no associated vehicle`,
      );
    }
    if (!mr.maintenance) {
      throw new Error(
        `MaintenanceRequirement ${mr.id} has no associated maintenance`,
      );
    }
    if (!mr.vehicle.model) {
      throw new Error(`Vehicle ${mr.vehicle.id} has no associated model`);
    }
    if (!mr.vehicle.model.brand) {
      throw new Error(
        `Vehicle model ${mr.vehicle.model.id} has no associated brand`,
      );
    }
    if (!mr.maintenance.category) {
      throw new Error(
        `Maintenance ${mr.maintenance.id} has no associated category`,
      );
    }

    return {
      id: mr.id,
      vehicle: {
        id: mr.vehicle.id,
        licensePlate: mr.vehicle.licensePlate,
        year: mr.vehicle.year,
        chassisNumber: mr.vehicle.chassisNumber ?? undefined,
        engineNumber: mr.vehicle.engineNumber ?? undefined,
        transmission: mr.vehicle.transmission ?? undefined,
        fuelType: mr.vehicle.fuelType ?? undefined,
        model: {
          id: mr.vehicle.model.id,
          name: mr.vehicle.model.name,
          vehicleType: mr.vehicle.model.vehicleType ?? undefined,
          brand: {
            id: mr.vehicle.model.brand.id,
            name: mr.vehicle.model.brand.name,
          },
        },
      },
      maintenance: {
        id: mr.maintenance.id,
        categoryId: mr.maintenance.category.id,
        category: { name: mr.maintenance.category.name },
        name: mr.maintenance.name,
        kilometersFrequency: mr.maintenance.kilometersFrequency ?? undefined,
        daysFrequency: mr.maintenance.daysFrequency ?? undefined,
        observations: mr.maintenance.observations ?? undefined,
        instructions: mr.maintenance.instructions ?? undefined,
      },
      kilometersFrequency: mr.kilometersFrequency ?? undefined,
      daysFrequency: mr.daysFrequency ?? undefined,
      observations: mr.observations ?? undefined,
      instructions: mr.instructions ?? undefined,
      startDate: mr.startDate,
      endDate: mr.endDate ?? undefined,
    };
  }

  async getById(id: string) {
    const ent = await this.repo.findOne(id);
    return ent ? this.map(ent) : null;
  }

  async create(data: {
    vehicleId: string;
    maintenanceId: string;
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
    startDate: string;
    endDate?: string | null;
  }): Promise<MaintenanceRequirementDTO> {
    const { vehicleId, maintenanceId, startDate, endDate } = data;

    // Validate vehicle and maintenance exist
    await validateVehicleExists(vehicleId);
    await validateMaintenanceExists(maintenanceId);

    // Check for overlapping requirements
    const overlapping = await this.repo.findOverlapping(
      vehicleId,
      maintenanceId,
      startDate,
      endDate ?? null,
    );

    if (overlapping.length > 0) {
      throw new AppError(
        `A maintenance requirement for this vehicle and maintenance already exists with overlapping dates`,
        409,
        "https://example.com/problems/overlapping-requirement",
        "Overlapping Requirement",
      );
    }

    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
      relations: ["model", "model.brand"],
    });
    const maintenance = await this.maintenanceRepo.findOne({
      where: { id: maintenanceId },
      relations: ["category"],
    });

    if (!vehicle || !maintenance) {
      throw new AppError(
        "Vehicle or Maintenance not found",
        404,
        "https://example.com/problems/not-found",
        "Not Found",
      );
    }

    const created = this.repo.create({
      vehicle,
      maintenance,
      kilometersFrequency: data.kilometersFrequency ?? null,
      daysFrequency: data.daysFrequency ?? null,
      observations: data.observations ?? null,
      instructions: data.instructions ?? null,
      startDate,
      endDate: endDate ?? null,
    });

    const saved = await this.repo.save(created);
    return this.map(saved);
  }

  async update(
    id: string,
    patch: {
      kilometersFrequency?: number | null;
      daysFrequency?: number | null;
      observations?: string | null;
      instructions?: string | null;
      startDate?: string;
      endDate?: string | null;
    },
  ): Promise<MaintenanceRequirementDTO | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;

    // If dates are being updated, check for overlaps
    const newStartDate = patch.startDate ?? existing.startDate;
    const newEndDate =
      patch.endDate !== undefined ? patch.endDate : existing.endDate;

    const overlapping = await this.repo.findOverlapping(
      existing.vehicle.id,
      existing.maintenance.id,
      newStartDate,
      newEndDate,
      id, // Exclude current requirement
    );

    if (overlapping.length > 0) {
      throw new AppError(
        `Cannot update: overlapping dates with another maintenance requirement`,
        409,
        "https://example.com/problems/overlapping-requirement",
        "Overlapping Requirement",
      );
    }

    if (patch.kilometersFrequency !== undefined)
      existing.kilometersFrequency = patch.kilometersFrequency ?? null;
    if (patch.daysFrequency !== undefined)
      existing.daysFrequency = patch.daysFrequency ?? null;
    if (patch.observations !== undefined)
      existing.observations = patch.observations ?? null;
    if (patch.instructions !== undefined)
      existing.instructions = patch.instructions ?? null;
    if (patch.startDate !== undefined) existing.startDate = patch.startDate;
    if (patch.endDate !== undefined) existing.endDate = patch.endDate ?? null;

    const saved = await this.repo.save(existing);
    return this.map(saved);
  }

  async delete(id: string) {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}
