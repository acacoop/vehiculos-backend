import { AppDataSource } from "../../db";
import { VehicleKilometers as VehicleKilometersEntity } from "../../entities/VehicleKilometers";
import { User } from "../../entities/User";
import { Vehicle } from "../../entities/Vehicle";
import type { VehicleKilometersLog } from "../../types";
import { AppError } from "../../middleware/errorHandler";

const repo = () => AppDataSource.getRepository(VehicleKilometersEntity);
const userRepo = () => AppDataSource.getRepository(User);
const vehicleRepo = () => AppDataSource.getRepository(Vehicle);

const mapEntity = (e: VehicleKilometersEntity): VehicleKilometersLog => ({
  id: e.id,
  vehicleId: e.vehicle.id,
  userId: e.user.id,
  date: e.date,
  kilometers: e.kilometers,
  createdAt: e.createdAt,
});

export const getVehicleKilometers = async (
  vehicleId: string,
): Promise<VehicleKilometersLog[]> => {
  const list = await repo().find({
    where: { vehicle: { id: vehicleId } },
    order: { date: "ASC" },
  });
  return list.map(mapEntity);
};

export const addVehicleKilometers = async (
  log: VehicleKilometersLog,
): Promise<VehicleKilometersLog> => {
  // Fetch closest previous (<= date but earlier) and next (> date)
  const prev = await repo()
    .createQueryBuilder("vk")
    .leftJoin("vk.vehicle", "vehicle")
    .where("vehicle.id = :vehicleId", { vehicleId: log.vehicleId })
    .andWhere("vk.date < :date", { date: log.date })
    .orderBy("vk.date", "DESC")
    .getOne();

  const next = await repo()
    .createQueryBuilder("vk")
    .leftJoin("vk.vehicle", "vehicle")
    .where("vehicle.id = :vehicleId", { vehicleId: log.vehicleId })
    .andWhere("vk.date > :date", { date: log.date })
    .orderBy("vk.date", "ASC")
    .getOne();

  if (prev && log.kilometers < prev.kilometers) {
    throw new AppError(
      `Kilometers ${log.kilometers} is less than previous recorded ${prev.kilometers} at ${prev.date.toISOString()}`,
      422,
      "https://example.com/problems/invalid-kilometers",
      "Invalid Kilometers Reading",
    );
  }
  if (next && log.kilometers > next.kilometers) {
    throw new AppError(
      `Kilometers ${log.kilometers} is greater than next recorded ${next.kilometers} at ${next.date.toISOString()}`,
      422,
      "https://example.com/problems/invalid-kilometers",
      "Invalid Kilometers Reading",
    );
  }

  const user = await userRepo().findOne({ where: { id: log.userId } });
  const vehicle = await vehicleRepo().findOne({ where: { id: log.vehicleId } });
  if (!user || !vehicle) throw new AppError("User or vehicle not found", 404);
  const created = repo().create({
    user,
    vehicle,
    date: log.date,
    kilometers: log.kilometers,
  });
  const saved = await repo().save(created);
  return mapEntity(saved);
};
