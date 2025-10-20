import { Vehicle } from "entities/Vehicle";
import { User } from "entities/User";
import { VehicleResponsible as VehicleResponsibleEntity } from "entities/VehicleResponsible";
import {
  IVehicleResponsibleRepository,
  VehicleResponsibleFilters,
} from "repositories/interfaces/IVehicleResponsibleRepository";
import type { VehicleResponsibleInput } from "schemas/vehicleResponsible";
import { AppError } from "middleware/errorHandler";
import {
  validateUserExists,
  validateVehicleExists,
} from "utils/validation/entity";
import { IsNull, Repository } from "typeorm";
import { RepositoryFindOptions } from "repositories/interfaces/common";

// Composite detail view (was in ../types)
export interface VehicleResponsibleWithDetails {
  id: string;
  startDate: string;
  endDate: string | null;
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
    year: number;
    model: { id: string; name: string; brand: { id: string; name: string } };
  };
}

function mapEntity(e: VehicleResponsibleEntity): VehicleResponsibleWithDetails {
  return {
    id: e.id,
    startDate: e.startDate,
    endDate: e.endDate,
    user: {
      id: e.user.id,
      firstName: e.user.firstName,
      lastName: e.user.lastName,
      cuit: e.user.cuit,
      email: e.user.email,
      active: e.user.active,
      entraId: e.user.entraId,
    },
    vehicle: {
      id: e.vehicle.id,
      licensePlate: e.vehicle.licensePlate,
      year: e.vehicle.year,
      model: {
        id: e.vehicle.model.id,
        name: e.vehicle.model.name,
        brand: {
          id: e.vehicle.model.brand.id,
          name: e.vehicle.model.brand.name,
        },
      },
    },
  };
}

export class VehicleResponsiblesService {
  constructor(
    private readonly repo: IVehicleResponsibleRepository,
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly userRepo: Repository<User>,
    private readonly vehicleResponsibleRepo: Repository<VehicleResponsibleEntity>,
  ) {}

  async getAll(
    options?: RepositoryFindOptions<VehicleResponsibleFilters>,
  ): Promise<{ items: VehicleResponsibleWithDetails[]; total: number }> {
    const [rows, total] = await this.repo.find(options);
    return { items: rows.map(mapEntity), total };
  }
  getById(id: string): Promise<VehicleResponsibleWithDetails | null> {
    return this.repo
      .findDetailedById(id)
      .then((e) => (e ? mapEntity(e) : null));
  }
  async getCurrentForVehicle(vehicleId: string) {
    const ent = await this.repo.findCurrentByVehicle(vehicleId);
    return ent ? mapEntity(ent) : null;
  }
  async getCurrentForUser(userId: string) {
    const list = await this.repo.findCurrentForUser(userId);
    return list.map(mapEntity);
  }

  private async assertNoOverlap(
    vehicleId: string,
    startDate: string,
    endDate: string | null,
    excludeId?: string,
  ) {
    const overlap = await this.repo.getOverlap(
      vehicleId,
      startDate,
      endDate,
      excludeId,
    );
    if (overlap) {
      throw new AppError(
        `Vehicle already has a responsible overlapping (${overlap.startDate} to ${overlap.endDate || "present"})`,
        400,
        "https://example.com/problems/overlap-error",
        "Vehicle Responsibility Overlap",
      );
    }
  }

  async create(
    data: VehicleResponsibleInput,
    //): Promise<VehicleResponsible | null> {
  ): Promise<VehicleResponsibleWithDetails | null> {
    const { vehicleId, userId, startDate, endDate = null } = data;
    await validateUserExists(userId);
    await validateVehicleExists(vehicleId);
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId },
    });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!vehicle || !user) return null;
    if (endDate !== null)
      await this.assertNoOverlap(vehicleId, startDate, endDate);
    if (endDate === null) {
      const previousEnd = new Date(
        new Date(startDate).getTime() - 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0];
      const active = await this.vehicleResponsibleRepo.find({
        where: { vehicle: { id: vehicleId }, endDate: IsNull() },
      });
      for (const a of active) {
        a.endDate = previousEnd;
        a.updatedAt = new Date();
        await this.repo.save(a);
      }
    }
    const created = this.repo.create({ vehicle, user, startDate, endDate });
    const saved = await this.repo.save(created);
    // Reload with model + brand for consistency
    const full = await this.repo.findDetailedById(saved.id);
    return full ? mapEntity(full) : null;
  }

  async update(
    id: string,
    data: Partial<VehicleResponsibleInput>,
    //): Promise<VehicleResponsible | null> {
  ): Promise<VehicleResponsibleWithDetails | null> {
    const ent = await this.vehicleResponsibleRepo.findOne({
      where: { id },
      relations: ["vehicle", "user"],
    });
    if (!ent) return null;
    if (data.userId) {
      await validateUserExists(data.userId);
      const u = await this.userRepo.findOne({ where: { id: data.userId } });
      if (u) ent.user = u;
    }
    if (data.startDate !== undefined) ent.startDate = data.startDate;
    if (data.endDate !== undefined) ent.endDate = data.endDate ?? null;
    if (ent.endDate === null) {
      const previousEnd = new Date(
        new Date(ent.startDate).getTime() - 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0];
      const others = await this.vehicleResponsibleRepo.find({
        where: { vehicle: { id: ent.vehicle.id }, endDate: IsNull() },
      });
      for (const o of others.filter((o) => o.id !== ent.id)) {
        o.endDate = previousEnd;
        o.updatedAt = new Date();
        await this.repo.save(o);
      }
    } else if (ent.endDate) {
      await this.assertNoOverlap(
        ent.vehicle.id,
        ent.startDate,
        ent.endDate,
        ent.id,
      );
    }
    ent.updatedAt = new Date();
    const saved = await this.repo.save(ent);
    const full = await this.repo.findDetailedById(saved.id);
    return full ? mapEntity(full) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.repo.delete(id);
    return res.affected === 1;
  }
}
