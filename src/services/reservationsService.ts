import { AppDataSource } from "../db";
import { Reservation as ReservationEntity } from "../entities/Reservation";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import type { Reservation, ReservationWithDetails } from "../types";
import { validateUserExists, validateVehicleExists } from "../utils/validators";
import { In } from "typeorm";

const repo = () => AppDataSource.getRepository(ReservationEntity);
const userRepo = () => AppDataSource.getRepository(User);
const vehicleRepo = () => AppDataSource.getRepository(Vehicle);

function mapEntity(e: ReservationEntity): ReservationWithDetails {
  return {
    id: e.id,
    startDate: new Date(e.startDate),
    endDate: new Date(e.endDate),
    user: {
      id: e.user.id,
      firstName: e.user.firstName,
      lastName: e.user.lastName,
      dni: e.user.dni,
      email: e.user.email,
      active: e.user.active,
    },
    vehicle: {
      id: e.vehicle.id,
      licensePlate: e.vehicle.licensePlate,
      brand: e.vehicle.brand,
      model: e.vehicle.model,
      year: e.vehicle.year,
      imgUrl: e.vehicle.imgUrl ?? undefined,
    },
  };
}

export const getAllReservations = async (options?: {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}): Promise<{ items: ReservationWithDetails[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  const where: Record<string, unknown> = {};
  if (searchParams?.userId) where.user = { id: searchParams.userId };
  if (searchParams?.vehicleId) where.vehicle = { id: searchParams.vehicleId };
  const [rows, total] = await repo().findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { startDate: "DESC" },
  });
  return { items: rows.map(mapEntity), total };
};

export const getReservationsByUserId = async (
  userId: string,
): Promise<ReservationWithDetails[]> => {
  const rows = await repo().find({
    where: { user: { id: userId } },
    order: { startDate: "DESC" },
  });
  return rows.map(mapEntity);
};

export const getReservationsByVehicleId = async (
  vehicleId: string,
): Promise<ReservationWithDetails[]> => {
  const rows = await repo().find({
    where: { vehicle: { id: vehicleId } },
    order: { startDate: "DESC" },
  });
  return rows.map(mapEntity);
};

export const getReservatiosOfAssignedVehiclesByUserId = async (
  userId: string,
): Promise<ReservationWithDetails[]> => {
  // Fetch reservations where vehicle is among vehicles reserved by assignments of this user
  const vehicleIds = (
    await AppDataSource.getRepository(ReservationEntity)
      .createQueryBuilder("r")
      .select("DISTINCT r.vehicle_id", "vehicleId")
      .innerJoin("assignments", "a", "a.vehicle_id = r.vehicle_id")
      .where("a.user_id = :userId", { userId })
      .getRawMany()
  ).map((r) => r.vehicleId);
  if (vehicleIds.length === 0) return [];
  const rows = await repo().find({
    where: { vehicle: { id: In(vehicleIds) } },
    order: { startDate: "DESC" },
  });
  return rows.map(mapEntity);
};

// No custom helper needed; using TypeORM In operator

export const getTodayReservationsByUserId = async (
  userId: string,
): Promise<ReservationWithDetails[]> => {
  const today = new Date().toISOString().split("T")[0];
  const rows = await repo()
    .createQueryBuilder("r")
    .leftJoinAndSelect("r.user", "user")
    .leftJoinAndSelect("r.vehicle", "vehicle")
    .where("r.user_id = :userId", { userId })
    .andWhere("r.start_date = :today", { today })
    .orderBy("r.start_date", "DESC")
    .getMany();
  return rows.map(mapEntity);
};

export const addReservation = async (
  reservation: Reservation,
): Promise<ReservationWithDetails | null> => {
  const { userId, vehicleId, startDate, endDate } = reservation;
  await validateUserExists(userId);
  await validateVehicleExists(vehicleId);
  const user = await userRepo().findOne({ where: { id: userId } });
  const vehicle = await vehicleRepo().findOne({ where: { id: vehicleId } });
  if (!user || !vehicle) return null;
  const created = repo().create({
    user,
    vehicle,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  });
  const saved = await repo().save(created);
  return mapEntity(saved);
};

export const getReservationById = async (
  id: string,
): Promise<ReservationWithDetails | null> => {
  const r = await repo().findOne({ where: { id } });
  return r ? mapEntity(r) : null;
};
