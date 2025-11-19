import { MaintenanceRequirement as MaintenanceRequirementEntity } from "@/entities/MaintenanceRequirement";
import {
  IMaintenanceRequirementRepository,
  MaintenanceRequirementFilters,
} from "@/repositories/interfaces/IMaintenanceRequirementRepository";
import {
  validateMaintenanceExists,
  validateVehicleModelExists,
} from "@/utils/validation/entity";
import type { VehicleModelType } from "@/schemas/vehicleModel";
import type { Maintenance as MaintenanceSchemaType } from "@/schemas/maintenance";
import { VehicleModel } from "@/entities/VehicleModel";
import { Maintenance } from "@/entities/Maintenance";
import { Repository } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { AppError } from "@/middleware/errorHandler";

export interface MaintenanceRequirementDTO {
  id: string;
  model: VehicleModelType;
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
    private readonly vehicleModelRepo: Repository<VehicleModel>,
    private readonly maintenanceRepo: Repository<Maintenance>,
  ) {}

  async getAll(
    options?: RepositoryFindOptions<MaintenanceRequirementFilters>,
  ): Promise<{ items: MaintenanceRequirementDTO[]; total: number }> {
    const [entities, _total] = await this.repo.findAndCount(options);
    // Filter out invalid entities (those without required relations)
    const validEntities = entities.filter(
      (e) =>
        e.model && e.maintenance && e.model.brand && e.maintenance.category,
    );

    if (validEntities.length < entities.length) {
      console.warn(
        `Found ${entities.length - validEntities.length} maintenance requirements with missing relations`,
      );
    }

    return {
      items: validEntities.map((e) => this.map(e)),
      total: validEntities.length,
    };
  }

  map(mr: MaintenanceRequirementEntity): MaintenanceRequirementDTO {
    // Defensive checks for relations that might be undefined
    if (!mr.model) {
      throw new Error(
        `MaintenanceRequirement ${mr.id} has no associated model`,
      );
    }
    if (!mr.maintenance) {
      throw new Error(
        `MaintenanceRequirement ${mr.id} has no associated maintenance`,
      );
    }
    if (!mr.model.brand) {
      throw new Error(`Vehicle model ${mr.model.id} has no associated brand`);
    }
    if (!mr.maintenance.category) {
      throw new Error(
        `Maintenance ${mr.maintenance.id} has no associated category`,
      );
    }

    return {
      id: mr.id,
      model: {
        id: mr.model.id,
        name: mr.model.name,
        vehicleType: mr.model.vehicleType ?? undefined,
        brand: {
          id: mr.model.brand.id,
          name: mr.model.brand.name,
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
    modelId: string;
    maintenanceId: string;
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
    startDate: string;
    endDate?: string | null;
  }): Promise<MaintenanceRequirementDTO> {
    const { modelId, maintenanceId, startDate, endDate } = data;

    // Validate model and maintenance exist
    await validateVehicleModelExists(modelId);
    await validateMaintenanceExists(maintenanceId);

    // Check for overlapping requirements
    const overlapping = await this.repo.findOverlapping(
      modelId,
      maintenanceId,
      startDate,
      endDate ?? null,
    );

    if (overlapping.length > 0) {
      throw new AppError(
        `A maintenance requirement for this model and maintenance already exists with overlapping dates`,
        409,
        "https://example.com/problems/overlapping-requirement",
        "Overlapping Requirement",
      );
    }

    const model = await this.vehicleModelRepo.findOne({
      where: { id: modelId },
      relations: ["brand"],
    });
    const maintenance = await this.maintenanceRepo.findOne({
      where: { id: maintenanceId },
      relations: ["category"],
    });

    if (!model || !maintenance) {
      throw new AppError(
        "Vehicle Model or Maintenance not found",
        404,
        "https://example.com/problems/not-found",
        "Not Found",
      );
    }

    const created = this.repo.create({
      model,
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
      existing.model.id,
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
