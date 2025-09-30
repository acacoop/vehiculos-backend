import { AssignmentRepository } from "../repositories/AssignmentRepository";
import { AppDataSource } from "../db";
import { Assignment as AssignmentEntity } from "../entities/Assignment";
import { User as UserEntity } from "../entities/User";
import { Vehicle as VehicleEntity } from "../entities/Vehicle";
import type { Assignment } from "../schemas/assignment";
import { validateUserExists, validateVehicleExists } from "../utils/validators";
import { validateISODateFormat } from "../utils/dateValidators";

// Composite detail type (previously in ../types)
export interface AssignmentWithDetails {
  id: string;
  startDate: string;
  endDate?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    cuit: string;
    email: string;
    active: boolean;
    entraId: string;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    model: {
      id: string;
      name: string;
      brand: { id: string; name: string };
    };
    year: number;
  };
}

function mapEntityToDetails(a: AssignmentEntity): AssignmentWithDetails {
  return {
    id: a.id,
    startDate: a.startDate,
    endDate: a.endDate ?? undefined,
    user: {
      id: a.user.id,
      firstName: a.user.firstName,
      lastName: a.user.lastName,
      cuit: a.user.cuit,
      email: a.user.email,
      active: a.user.active,
      entraId: a.user.entraId,
    },
    vehicle: {
      id: a.vehicle.id,
      licensePlate: a.vehicle.licensePlate,
      model: {
        id: a.vehicle.model.id,
        name: a.vehicle.model.name,
        brand: {
          id: a.vehicle.model.brand.id,
          name: a.vehicle.model.brand.name,
        },
      },
      year: a.vehicle.year,
    },
  };
}

export interface GetAllAssignmentsOptions {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}

export class AssignmentsService {
  private readonly repo: AssignmentRepository;
  private readonly userRepo = () => AppDataSource.getRepository(UserEntity);
  private readonly vehicleRepo = () =>
    AppDataSource.getRepository(VehicleEntity);

  constructor(repo?: AssignmentRepository) {
    this.repo = repo ?? new AssignmentRepository(AppDataSource);
  }

  async getAll(
    options?: GetAllAssignmentsOptions,
  ): Promise<{ items: AssignmentWithDetails[]; total: number }> {
    const { limit, offset, searchParams } = options || {};
    const { 0: list, 1: total } = await this.repo.findAndCount({
      limit,
      offset,
      searchParams,
    });
    return { items: list.map(mapEntityToDetails), total };
  }

  async getById(id: string): Promise<Assignment | null> {
    const a = await this.repo.findOne(id);
    return a
      ? {
          id: a.id,
          userId: a.user.id,
          vehicleId: a.vehicle.id,
          startDate: a.startDate,
          endDate: a.endDate ?? undefined,
        }
      : null;
  }

  async getWithDetailsById(id: string): Promise<AssignmentWithDetails | null> {
    const a = await this.repo.findOne(id);
    return a ? mapEntityToDetails(a) : null;
  }

  async isVehicleAssignedToUser(
    userId: string,
    vehicleId: string,
  ): Promise<boolean> {
    const count = await this.repo.count({
      user: { id: userId },
      vehicle: { id: vehicleId },
    });
    return count > 0;
  }

  async create(data: Omit<Assignment, "id">): Promise<Assignment | null> {
    const { userId, vehicleId, startDate, endDate } = data;
    await validateUserExists(userId);
    await validateVehicleExists(vehicleId);
    if (endDate && startDate && new Date(endDate) <= new Date(startDate))
      throw new Error("End date must be after start date.");
    const user = await this.userRepo().findOne({ where: { id: userId } });
    const vehicle = await this.vehicleRepo().findOne({
      where: { id: vehicleId },
    });
    if (!user || !vehicle) return null;
    const entity = this.repo.create({
      user,
      vehicle,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate ?? null,
    });
    const saved = await this.repo.save(entity);
    return {
      id: saved.id,
      userId: saved.user.id,
      vehicleId: saved.vehicle.id,
      startDate: saved.startDate,
      endDate: saved.endDate ?? undefined,
    };
  }

  async update(
    id: string,
    patch: Partial<Assignment>,
  ): Promise<AssignmentWithDetails | null> {
    const entity = await this.repo.findOne(id);
    if (!entity) return null;
    if (patch.userId) {
      await validateUserExists(patch.userId);
      const user = await this.userRepo().findOne({
        where: { id: patch.userId },
      });
      if (user) entity.user = user;
    }
    if (patch.vehicleId) {
      await validateVehicleExists(patch.vehicleId);
      const vehicle = await this.vehicleRepo().findOne({
        where: { id: patch.vehicleId },
      });
      if (vehicle) entity.vehicle = vehicle;
    }
    if (patch.startDate !== undefined) {
      validateISODateFormat(patch.startDate, "startDate");
      entity.startDate = patch.startDate;
    }
    if (patch.endDate !== undefined) {
      if (patch.endDate) validateISODateFormat(patch.endDate, "endDate");
      entity.endDate = patch.endDate ?? null;
    }
    if (
      entity.endDate &&
      entity.startDate &&
      new Date(entity.endDate) <= new Date(entity.startDate)
    )
      throw new Error("End date must be after start date.");
    const saved = await this.repo.save(entity);
    return mapEntityToDetails(saved);
  }

  async finish(
    id: string,
    endDate?: string,
  ): Promise<AssignmentWithDetails | null> {
    const entity = await this.repo.findOne(id);
    if (!entity) return null;
    const finalEnd = endDate || new Date().toISOString().split("T")[0];
    if (entity.startDate && new Date(finalEnd) <= new Date(entity.startDate))
      throw new Error("End date must be after start date.");
    entity.endDate = finalEnd;
    const saved = await this.repo.save(entity);
    return mapEntityToDetails(saved);
  }
}

export function createAssignmentsService() {
  return new AssignmentsService();
}
