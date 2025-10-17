import { AppDataSource } from "../db";
import { VehicleKilometers as VehicleKilometersEntity } from "../entities/VehicleKilometers";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import type { VehicleKilometersLog } from "../schemas/vehicleKilometers";
import { AppError } from "../middleware/errorHandler";
import { VehicleKilometersRepository } from "../repositories/VehicleKilometersRepository";

function mapEntity(e: VehicleKilometersEntity): VehicleKilometersLog {
  return {
    id: e.id,
    vehicleId: e.vehicle.id,
    userId: e.user.id,
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

  async getByVehicle(vehicleId: string): Promise<VehicleKilometersLog[]> {
    const list = await this.repo.findByVehicle(vehicleId);
    return list.map(mapEntity);
  }
  async create(log: VehicleKilometersLog): Promise<VehicleKilometersLog> {
    const prev = await this.repo.findPrev(log.vehicleId, log.date);
    const next = await this.repo.findNext(log.vehicleId, log.date);
    if (prev && log.kilometers < prev.kilometers)
      throw new AppError(
        `Kilometers ${log.kilometers} is less than previous recorded ${prev.kilometers} at ${prev.date.toISOString()}`,
        422,
        "https://example.com/problems/invalid-kilometers",
        "Invalid Kilometers Reading",
      );
    if (next && log.kilometers > next.kilometers)
      throw new AppError(
        `Kilometers ${log.kilometers} is greater than next recorded ${next.kilometers} at ${next.date.toISOString()}`,
        422,
        "https://example.com/problems/invalid-kilometers",
        "Invalid Kilometers Reading",
      );
    const user = await this.userRepo().findOne({ where: { id: log.userId } });
    const vehicle = await this.vehicleRepo().findOne({
      where: { id: log.vehicleId },
    });
    if (!user || !vehicle) throw new AppError("User or vehicle not found", 404);
    const entity = this.repo.create({
      user,
      vehicle,
      date: log.date,
      kilometers: log.kilometers,
    });
    const saved = await this.repo.save(entity);
    return mapEntity(saved);
  }
}

export function createVehicleKilometersService() {
  return new VehicleKilometersService();
}
