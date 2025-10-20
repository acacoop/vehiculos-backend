import { Maintenance } from "entities/Maintenance";
import { MaintenanceCategory } from "entities/MaintenanceCategory";
import { AssignedMaintenance } from "entities/AssignedMaintenance";
import { IMaintenanceRepository } from "repositories/interfaces/IMaintenanceRepository";
import { IAssignedMaintenanceRepository } from "repositories/interfaces/IAssignedMaintenanceRepository";
import {
  IMaintenanceRecordRepository,
  MaintenanceRecordFilters,
} from "repositories/interfaces/IMaintenanceRecordRepository";
import {
  validateMaintenanceCategoryExists,
  validateMaintenanceExists,
  validateVehicleExists,
} from "utils/validation/entity";
import type { Maintenance as MaintenanceSchemaType } from "schemas/maintenance";
import type { MaintenanceRecord } from "schemas/maintenanceRecord";
import { Vehicle } from "entities/Vehicle";
import { MaintenanceRecord as MaintenanceRecordEntity } from "entities/MaintenanceRecord";
import { Repository } from "typeorm";
import { User } from "entities/User";
import { RepositoryFindOptions } from "repositories/interfaces/common";

export type MaintenanceDTO = MaintenanceSchemaType & {
  kilometersFrequency?: number;
  daysFrequency?: number;
  observations?: string;
  instructions?: string;
  categoryName?: string;
};

export interface MaintenanceVehicleAssignment {
  id: string;
  vehicleId: string;
  maintenanceId: string;
  kilometersFrequency?: number;
  daysFrequency?: number;
  licensePlate: string;
  model: {
    id: string;
    name: string;
    brand: { id: string; name: string };
  };
  year: number;
}
export interface AssignedMaintenanceDTO {
  id: string;
  vehicleId: string;
  maintenanceId: string;
  kilometersFrequency?: number;
  daysFrequency?: number;
  observations?: string;
  instructions?: string;
  maintenance_name: string;
  maintenance_category_name?: string;
  maintenance_observations?: string;
  maintenance_instructions?: string;
}

function map(m: Maintenance): MaintenanceDTO & {
  kilometersFrequency?: number;
  daysFrequency?: number;
  observations?: string;
  instructions?: string;
} {
  return {
    id: m.id,
    categoryId: m.category.id,
    categoryName: m.category?.name,
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
    private readonly assignedRepo: IAssignedMaintenanceRepository,
    private readonly maintenanceCategoryRepo: Repository<MaintenanceCategory>,
  ) {}
  async getAll(): Promise<MaintenanceDTO[]> {
    const list = await this.repo.findAll();
    return list.map(map);
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
  async getVehicles(
    maintenanceId: string,
  ): Promise<MaintenanceVehicleAssignment[]> {
    const list = await this.assignedRepo.findByMaintenance(maintenanceId);
    return list.map((am) => ({
      id: am.id,
      vehicleId: am.vehicle.id,
      maintenanceId: am.maintenance.id,
      kilometersFrequency: am.kilometersFrequency ?? undefined,
      daysFrequency: am.daysFrequency ?? undefined,
      licensePlate: am.vehicle.licensePlate,
      model: {
        id: am.vehicle.model.id,
        name: am.vehicle.model.name,
        brand: {
          id: am.vehicle.model.brand.id,
          name: am.vehicle.model.brand.name,
        },
      },
      year: am.vehicle.year,
    }));
  }
}

export class AssignedMaintenancesService {
  constructor(
    private readonly repo: IAssignedMaintenanceRepository,
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly maintenanceRepo: Repository<Maintenance>,
  ) {}
  map(am: AssignedMaintenance): AssignedMaintenanceDTO {
    return {
      id: am.id,
      vehicleId: am.vehicle.id,
      maintenanceId: am.maintenance.id,
      kilometersFrequency: am.kilometersFrequency ?? undefined,
      daysFrequency: am.daysFrequency ?? undefined,
      observations: am.observations ?? undefined,
      instructions: am.instructions ?? undefined,
      maintenance_name: am.maintenance.name,
      maintenance_category_name: am.maintenance.category?.name,
      maintenance_observations: am.maintenance.observations ?? undefined,
      maintenance_instructions: am.maintenance.instructions ?? undefined,
    };
  }
  async getByVehicle(vehicleId: string) {
    const list = await this.repo.findByVehicle(vehicleId);
    return list.map(this.map);
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
  }): Promise<AssignedMaintenanceDTO | null> {
    const { vehicleId, maintenanceId } = data;
    await validateVehicleExists(vehicleId);
    await validateMaintenanceExists(maintenanceId);
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
    });
    const maintenance = await this.maintenanceRepo.findOne({
      where: { id: maintenanceId },
      relations: ["category"],
    });
    if (!vehicle || !maintenance) return null;
    const created = this.repo.create({
      vehicle,
      maintenance,
      kilometersFrequency: data.kilometersFrequency ?? null,
      daysFrequency: data.daysFrequency ?? null,
      observations: data.observations ?? null,
      instructions: data.instructions ?? null,
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
    },
  ): Promise<AssignedMaintenanceDTO | null> {
    const existing = await this.repo.findOne(id);
    if (!existing) return null;
    if (patch.kilometersFrequency !== undefined)
      existing.kilometersFrequency = patch.kilometersFrequency ?? null;
    if (patch.daysFrequency !== undefined)
      existing.daysFrequency = patch.daysFrequency ?? null;
    if (patch.observations !== undefined)
      existing.observations = patch.observations ?? null;
    if (patch.instructions !== undefined)
      existing.instructions = patch.instructions ?? null;
    const saved = await this.repo.save(existing);
    return this.map(saved);
  }
  async delete(id: string) {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}

export class MaintenanceRecordsService {
  constructor(
    private readonly recordRepo: IMaintenanceRecordRepository,
    private readonly maintenanceRecordRepo: Repository<MaintenanceRecordEntity>,
    private readonly assignedRepo: Repository<AssignedMaintenance>,
    private readonly userRepo: Repository<User>,
  ) {}
  private mapEntity(mr: MaintenanceRecordEntity): MaintenanceRecord {
    return {
      id: mr.id,
      assignedMaintenanceId: mr.assignedMaintenance.id,
      userId: mr.user.id,
      date: new Date(mr.date),
      kilometers: mr.kilometers,
      notes: mr.notes ?? undefined,
    };
  }
  async getAll(options?: RepositoryFindOptions<MaintenanceRecordFilters>) {
    const [rows, total] = await this.recordRepo.findAndCount(options);
    return {
      items: rows.map((r) => this.mapEntity(r as MaintenanceRecordEntity)),
      total,
    };
  }
  async getByVehicle(vehicleId: string) {
    const list = await this.recordRepo.findByVehicle(vehicleId);
    return list.map((r) => this.mapEntity(r as MaintenanceRecordEntity));
  }
  async getById(id: string) {
    const found = await this.recordRepo.findOne(id);
    return found ? this.mapEntity(found as MaintenanceRecordEntity) : null;
  }
  async create(data: {
    assignedMaintenanceId: string;
    userId: string;
    date: Date;
    kilometers: number;
    notes?: string;
  }) {
    const assigned = await this.assignedRepo.findOne({
      where: { id: data.assignedMaintenanceId },
    });
    const user = await this.userRepo.findOne({ where: { id: data.userId } });
    if (!assigned || !user) return null;
    const created = this.maintenanceRecordRepo.create({
      assignedMaintenance: assigned,
      user,
      date: data.date.toISOString().split("T")[0],
      kilometers: data.kilometers,
      notes: data.notes ?? null,
    });
    const saved = await this.maintenanceRecordRepo.save(created);
    return this.mapEntity(saved);
  }
  async getByAssignedMaintenance(assignedMaintenanceId: string) {
    const list = await this.recordRepo.findByAssignedMaintenance(
      assignedMaintenanceId,
    );
    return list.map((r) => this.mapEntity(r as MaintenanceRecordEntity));
  }
}
