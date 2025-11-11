import { AppDataSource } from "@/db";
import { VehicleKilometers as VehicleKilometersEntity } from "@/entities/VehicleKilometers";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import type {
  VehicleKilometersLog,
  VehicleKilometersLogOutput,
  VehicleKilometersLogUpdate,
} from "@/schemas/vehicleKilometers";
import { AppError } from "@/middleware/errorHandler";
import { VehicleKilometersRepository } from "@/repositories/VehicleKilometersRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { VehicleKilometersFilters } from "@/repositories/interfaces/IVehicleKilometersRepository";

function mapEntity(e: VehicleKilometersEntity): VehicleKilometersLogOutput {
  return {
    id: e.id,
    user: {
      id: e.user.id,
      firstName: e.user.firstName,
      lastName: e.user.lastName,
      email: e.user.email,
      cuit: e.user.cuit,
      active: e.user.active,
      entraId: e.user.entraId,
    },
    vehicle: {
      id: e.vehicle.id,
      licensePlate: e.vehicle.licensePlate,
      year: e.vehicle.year,
      chassisNumber: e.vehicle.chassisNumber,
      engineNumber: e.vehicle.engineNumber,
      transmission: e.vehicle.transmission,
      fuelType: e.vehicle.fuelType,
      model: {
        id: e.vehicle.model.id,
        name: e.vehicle.model.name,
        vehicleType: e.vehicle.model.vehicleType,
        brand: {
          id: e.vehicle.model.brand.id,
          name: e.vehicle.model.brand.name,
        },
      },
    },
    date: e.date,
    kilometers: e.kilometers,
  };
}

export class VehicleKilometersService {
  private readonly repo: VehicleKilometersRepository;
  private readonly userRepo = () => AppDataSource.getRepository(User);
  private readonly vehicleRepo = () => AppDataSource.getRepository(Vehicle);

  constructor(repo?: VehicleKilometersRepository) {
    this.repo = repo ?? new VehicleKilometersRepository(AppDataSource);
  }

  async getAll(
    options: RepositoryFindOptions<Partial<VehicleKilometersFilters>>,
  ): Promise<{ items: VehicleKilometersLogOutput[]; total: number }> {
    const { items, total } = await this.repo.findAll(options);
    return { items: items.map(mapEntity), total };
  }

  async getById(id: string): Promise<VehicleKilometersLogOutput | null> {
    const entity = await this.repo.findById(id);
    return entity ? mapEntity(entity) : null;
  }

  async getByVehicle(vehicleId: string): Promise<VehicleKilometersLogOutput[]> {
    const list = await this.repo.findByVehicle(vehicleId);
    return list.map(mapEntity);
  }

  private async validateKilometersReading(
    vehicleId: string,
    date: Date,
    kilometers: number,
    excludeId?: string,
  ): Promise<void> {
    const prev = await this.repo.findPrev(vehicleId, date);
    const next = await this.repo.findNext(vehicleId, date);

    // Skip validation if the prev/next record is the one we're updating
    if (prev && prev.id !== excludeId && kilometers < prev.kilometers) {
      throw new AppError(
        `Kilometers ${kilometers} is less than previous recorded ${prev.kilometers} at ${prev.date.toISOString()}`,
        422,
        "https://example.com/problems/invalid-kilometers",
        "Invalid Kilometers Reading",
      );
    }
    if (next && next.id !== excludeId && kilometers > next.kilometers) {
      throw new AppError(
        `Kilometers ${kilometers} is greater than next recorded ${next.kilometers} at ${next.date.toISOString()}`,
        422,
        "https://example.com/problems/invalid-kilometers",
        "Invalid Kilometers Reading",
      );
    }
  }

  async create(log: VehicleKilometersLog): Promise<VehicleKilometersLogOutput> {
    await this.validateKilometersReading(
      log.vehicleId,
      log.date,
      log.kilometers,
    );

    const user = await this.userRepo().findOne({ where: { id: log.userId } });
    const vehicle = await this.vehicleRepo().findOne({
      where: { id: log.vehicleId },
      relations: ["model", "model.brand"],
    });

    if (!user || !vehicle) {
      throw new AppError("User or vehicle not found", 404);
    }

    const entity = this.repo.create({
      user,
      vehicle,
      date: log.date,
      kilometers: log.kilometers,
    });

    const saved = await this.repo.save(entity);
    return mapEntity(saved);
  }

  async update(
    id: string,
    updateData: VehicleKilometersLogUpdate,
  ): Promise<VehicleKilometersLogOutput | null> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      return null;
    }

    // Check if we're updating kilometers or date, then validate
    const newKilometers = updateData.kilometers ?? existing.kilometers;
    const newDate = updateData.date ?? existing.date;
    const vehicleId = updateData.vehicleId ?? existing.vehicle.id;

    if (
      updateData.kilometers !== undefined ||
      updateData.date !== undefined ||
      updateData.vehicleId !== undefined
    ) {
      await this.validateKilometersReading(
        vehicleId,
        newDate,
        newKilometers,
        id,
      );
    }

    // Update fields
    if (updateData.userId) {
      const user = await this.userRepo().findOne({
        where: { id: updateData.userId },
      });
      if (!user) {
        throw new AppError("User not found", 404);
      }
      existing.user = user;
    }

    if (updateData.vehicleId && updateData.vehicleId !== existing.vehicle.id) {
      const vehicle = await this.vehicleRepo().findOne({
        where: { id: updateData.vehicleId },
        relations: ["model", "model.brand"],
      });
      if (!vehicle) {
        throw new AppError("Vehicle not found", 404);
      }
      existing.vehicle = vehicle;
    }

    if (updateData.date !== undefined) {
      existing.date = updateData.date;
    }
    if (updateData.kilometers !== undefined) {
      existing.kilometers = updateData.kilometers;
    }

    const saved = await this.repo.save(existing);
    return mapEntity(saved);
  }

  async delete(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
}

export function createVehicleKilometersService() {
  return new VehicleKilometersService();
}
