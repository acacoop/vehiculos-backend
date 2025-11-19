import { Maintenance } from "@/entities/Maintenance";
import { MaintenanceCategory } from "@/entities/MaintenanceCategory";
import {
  IMaintenanceRepository,
  MaintenanceFilters,
} from "@/repositories/interfaces/IMaintenanceRepository";
import { IMaintenanceRequirementRepository } from "@/repositories/interfaces/IMaintenanceRequirementRepository";
import {
  IMaintenanceRecordRepository,
  MaintenanceRecordFilters,
} from "@/repositories/interfaces/IMaintenanceRecordRepository";
import {
  validateMaintenanceCategoryExists,
  validateMaintenanceExists,
  validateVehicleExists,
} from "@/utils/validation/entity";
import type { Maintenance as MaintenanceSchemaType } from "@/schemas/maintenance";
import type { MaintenanceRecordDTO } from "@/schemas/maintenanceRecord";
import { Vehicle } from "@/entities/Vehicle";
import { MaintenanceRecord as MaintenanceRecordEntity } from "@/entities/MaintenanceRecord";
import { Repository } from "typeorm";
import { User } from "@/entities/User";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export type MaintenanceDTO = MaintenanceSchemaType & {
  kilometersFrequency?: number;
  daysFrequency?: number;
  observations?: string;
  instructions?: string;
  category?: { name: string };
};

function map(m: Maintenance): MaintenanceDTO & {
  kilometersFrequency?: number;
  daysFrequency?: number;
  observations?: string;
  instructions?: string;
} {
  return {
    id: m.id,
    categoryId: m.category.id,
    category: m.category ? { name: m.category.name } : undefined,
    name: m.name,
    kilometersFrequency: m.kilometersFrequency ?? undefined,
    daysFrequency: m.daysFrequency ?? undefined,
    observations: m.observations ?? undefined,
    instructions: m.instructions ?? undefined,
  } as MaintenanceDTO & {
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
  };
}

export class MaintenancesService {
  constructor(
    private readonly repo: IMaintenanceRepository,
    private readonly requirementRepo: IMaintenanceRequirementRepository,
    private readonly maintenanceCategoryRepo: Repository<MaintenanceCategory>,
  ) {}
  async getAll(
    options?: RepositoryFindOptions<MaintenanceFilters>,
  ): Promise<{ items: MaintenanceDTO[]; total: number }> {
    const [entities, total] = await this.repo.findAndCount(options);
    return { items: entities.map(map), total };
  }
  async getById(id: string): Promise<MaintenanceDTO | null> {
    const ent = await this.repo.findOne(id);
    return ent ? map(ent) : null;
  }
  async getWithDetails(id: string) {
    const ent = await this.repo.findOne(id);
    return ent ? map(ent) : null;
  }
  async create(data: {
    categoryId: string;
    name: string;
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
  }): Promise<MaintenanceDTO | null> {
    await validateMaintenanceCategoryExists(data.categoryId);
    const category = await this.maintenanceCategoryRepo.findOne({
      where: { id: data.categoryId },
    });
    if (!category) return null;
    const created = this.repo.create({
      category,
      name: data.name,
      kilometersFrequency: data.kilometersFrequency ?? null,
      daysFrequency: data.daysFrequency ?? null,
      observations: data.observations ?? null,
      instructions: data.instructions ?? null,
    });
    const saved = await this.repo.save(created as Maintenance);
    return map(saved);
  }
  async update(
    id: string,
    patch: {
      categoryId?: string;
      name?: string;
      kilometersFrequency?: number | null;
      daysFrequency?: number | null;
      observations?: string | null;
      instructions?: string | null;
    },
  ): Promise<MaintenanceDTO | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (patch.categoryId) {
      await validateMaintenanceCategoryExists(patch.categoryId);
      const category = await this.maintenanceCategoryRepo.findOne({
        where: { id: patch.categoryId },
      });
      if (category) existing.category = category;
    }
    if (patch.name !== undefined) existing.name = patch.name;
    type PatchExt = typeof patch & {
      kilometersFrequency?: number | null;
      daysFrequency?: number | null;
      observations?: string | null;
      instructions?: string | null;
    };
    const p = patch as PatchExt;
    if (p.kilometersFrequency !== undefined)
      existing.kilometersFrequency = p.kilometersFrequency ?? null;
    if (p.daysFrequency !== undefined)
      existing.daysFrequency = p.daysFrequency ?? null;
    if (p.observations !== undefined)
      existing.observations = p.observations ?? null;
    if (p.instructions !== undefined)
      existing.instructions = p.instructions ?? null;
    const saved = await this.repo.save(existing);
    return map(saved);
  }
  async delete(id: string): Promise<boolean> {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}

export class MaintenanceRecordsService {
  constructor(
    private readonly recordRepo: IMaintenanceRecordRepository,
    private readonly maintenanceRecordRepo: Repository<MaintenanceRecordEntity>,
    private readonly maintenanceRepo: Repository<Maintenance>,
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly userRepo: Repository<User>,
  ) {}

  private mapEntity(mr: MaintenanceRecordEntity): MaintenanceRecordDTO {
    // Defensive checks for relations that might be undefined
    if (!mr.user) {
      throw new Error(`MaintenanceRecord ${mr.id} has no associated user`);
    }
    if (!mr.maintenance) {
      throw new Error(
        `MaintenanceRecord ${mr.id} has no associated maintenance`,
      );
    }
    if (!mr.vehicle) {
      throw new Error(`MaintenanceRecord ${mr.id} has no associated vehicle`);
    }

    return {
      id: mr.id,
      user: {
        id: mr.user.id,
        firstName: mr.user.firstName,
        lastName: mr.user.lastName,
        cuit: mr.user.cuit,
        email: mr.user.email,
        entraId: mr.user.entraId,
        active: mr.user.active,
      },
      maintenance: this.mapMaintenance(mr.maintenance) as {
        id: string;
        categoryId: string;
        category: { name: string };
        name: string;
        kilometersFrequency?: number;
        daysFrequency?: number;
        observations?: string;
        instructions?: string;
      },
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
      date: new Date(mr.date),
      kilometers: mr.kilometers,
      notes: mr.notes ?? undefined,
    };
  }

  private mapMaintenance(m: Maintenance): {
    id: string;
    categoryId: string;
    category: { name: string };
    name: string;
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
  } {
    // Defensive checks for relations that might be undefined
    if (!m.category) {
      throw new Error(`Maintenance ${m.id} has no associated category`);
    }

    return {
      id: m.id,
      categoryId: m.category.id,
      category: { name: m.category.name },
      name: m.name,
      kilometersFrequency: m.kilometersFrequency ?? undefined,
      daysFrequency: m.daysFrequency ?? undefined,
      observations: m.observations ?? undefined,
      instructions: m.instructions ?? undefined,
    };
  }

  async getAll(
    options?: RepositoryFindOptions<MaintenanceRecordFilters>,
  ): Promise<{ items: MaintenanceRecordDTO[]; total: number }> {
    const [rows, total] = await this.recordRepo.findAndCount(options);
    return {
      items: rows.map((r) => this.mapEntity(r as MaintenanceRecordEntity)),
      total,
    };
  }

  async getByVehicle(vehicleId: string): Promise<MaintenanceRecordDTO[]> {
    const list = await this.recordRepo.findByVehicle(vehicleId);
    return list.map((r) => this.mapEntity(r as MaintenanceRecordEntity));
  }

  async getById(id: string): Promise<MaintenanceRecordDTO | null> {
    const found = await this.recordRepo.findOne(id);
    return found ? this.mapEntity(found as MaintenanceRecordEntity) : null;
  }

  async create(data: {
    maintenanceId: string;
    vehicleId: string;
    userId: string;
    date: Date;
    kilometers: number;
    notes?: string;
  }): Promise<MaintenanceRecordDTO | null> {
    await validateMaintenanceExists(data.maintenanceId);
    await validateVehicleExists(data.vehicleId);

    const maintenance = await this.maintenanceRepo.findOne({
      where: { id: data.maintenanceId },
      relations: ["category"],
    });
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: data.vehicleId },
      relations: ["model", "model.brand"],
    });
    const user = await this.userRepo.findOne({ where: { id: data.userId } });

    if (!maintenance || !vehicle || !user) return null;

    const created = this.maintenanceRecordRepo.create({
      maintenance,
      vehicle,
      user,
      date: data.date.toISOString().split("T")[0],
      kilometers: data.kilometers,
      notes: data.notes ?? null,
    });
    const saved = await this.maintenanceRecordRepo.save(created);
    return this.mapEntity(saved);
  }

  async getByMaintenance(
    maintenanceId: string,
  ): Promise<MaintenanceRecordDTO[]> {
    const list = await this.recordRepo.findByMaintenance(maintenanceId);
    return list.map((r) => this.mapEntity(r as MaintenanceRecordEntity));
  }
}
