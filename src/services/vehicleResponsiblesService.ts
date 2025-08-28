import { AppDataSource } from "../db";
import { VehicleResponsible as VehicleResponsibleEntity } from "../entities/VehicleResponsible";
import { Vehicle } from "../entities/Vehicle";
import { User } from "../entities/User";
import {
  VehicleResponsible,
  VehicleResponsibleWithDetails,
  VehicleResponsibleInput,
} from "../types";
import { AppError } from "../middleware/errorHandler";
import { validateUserExists, validateVehicleExists } from "../utils/validators";
import { IsNull } from "typeorm";

const repo = () => AppDataSource.getRepository(VehicleResponsibleEntity);
const vehicleRepo = () => AppDataSource.getRepository(Vehicle);
const userRepo = () => AppDataSource.getRepository(User);

function mapEntity(e: VehicleResponsibleEntity): VehicleResponsibleWithDetails {
  return {
    id: e.id,
    startDate: e.startDate,
    endDate: e.endDate,
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

export const getAllVehicleResponsibles = async (options?: {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}): Promise<{ items: VehicleResponsibleWithDetails[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  const qb = repo()
    .createQueryBuilder("vr")
    .leftJoinAndSelect("vr.user", "user")
    .leftJoinAndSelect("vr.vehicle", "vehicle");
  if (searchParams?.vehicleId)
    qb.andWhere("vehicle.id = :vehicleId", {
      vehicleId: searchParams.vehicleId,
    });
  if (searchParams?.userId)
    qb.andWhere("user.id = :userId", { userId: searchParams.userId });
  if (searchParams?.active === "true") qb.andWhere("vr.end_date IS NULL");
  if (searchParams?.active === "false") qb.andWhere("vr.end_date IS NOT NULL");
  if (searchParams?.date) {
    qb.andWhere(
      "vr.start_date <= :d AND (vr.end_date IS NULL OR vr.end_date >= :d)",
      { d: searchParams.date },
    );
  }
  const [rows, total] = await qb
    .orderBy("vr.start_date", "DESC")
    .skip(offset)
    .take(limit)
    .getManyAndCount();
  return { items: rows.map(mapEntity), total };
};

export const getVehicleResponsibleById = async (
  id: string,
): Promise<VehicleResponsibleWithDetails | null> => {
  const ent = await repo().findOne({ where: { id } });
  return ent ? mapEntity(ent) : null;
};

export const getCurrentResponsibleForVehicle = async (
  vehicleId: string,
): Promise<VehicleResponsibleWithDetails | null> => {
  const ent = await repo().findOne({
    where: { vehicle: { id: vehicleId }, endDate: IsNull() },
  });
  return ent ? mapEntity(ent) : null;
};

export const getResponsibleForVehicleOnDate = async (
  vehicleId: string,
  date: string,
): Promise<VehicleResponsibleWithDetails | null> => {
  const ent = await repo()
    .createQueryBuilder("vr")
    .leftJoinAndSelect("vr.user", "user")
    .leftJoinAndSelect("vr.vehicle", "vehicle")
    .where("vehicle.id = :vehicleId", { vehicleId })
    .andWhere(
      "vr.start_date <= :d AND (vr.end_date IS NULL OR vr.end_date >= :d)",
      { d: date },
    )
    .orderBy("vr.start_date", "DESC")
    .getOne();
  return ent ? mapEntity(ent) : null;
};

export const getCurrentVehiclesForUser = async (
  userId: string,
): Promise<VehicleResponsibleWithDetails[]> => {
  const list = await repo().find({
    where: { user: { id: userId }, endDate: IsNull() },
    order: { startDate: "DESC" },
  });
  return list.map(mapEntity);
};

export const getVehiclesForUserOnDate = async (
  userId: string,
  date: string,
): Promise<VehicleResponsibleWithDetails[]> => {
  const list = await repo()
    .createQueryBuilder("vr")
    .leftJoinAndSelect("vr.user", "user")
    .leftJoinAndSelect("vr.vehicle", "vehicle")
    .where("user.id = :userId", { userId })
    .andWhere(
      "vr.start_date <= :d AND (vr.end_date IS NULL OR vr.end_date >= :d)",
      { d: date },
    )
    .orderBy("vr.start_date", "DESC")
    .getMany();
  return list.map(mapEntity);
};

// Overlap detection with open-ended ranges
async function assertNoOverlap(
  vehicleId: string,
  startDate: string,
  endDate: string | null,
  excludeId?: string,
) {
  const qb = repo()
    .createQueryBuilder("vr")
    .where("vr.vehicle_id = :vehicleId", { vehicleId });
  if (excludeId) qb.andWhere("vr.id != :excludeId", { excludeId });
  qb.andWhere(
    "(:start < COALESCE(vr.end_date, :max)) AND (COALESCE(:end, :max) > vr.start_date)",
    {
      start: startDate,
      end: endDate,
      max: "9999-12-31",
    },
  );
  const overlap = await qb.getOne();
  if (overlap) {
    throw new AppError(
      `Vehicle already has a responsible overlapping (${overlap.startDate} to ${overlap.endDate || "present"})`,
      400,
      "https://example.com/problems/overlap-error",
      "Vehicle Responsibility Overlap",
    );
  }
}

export const addVehicleResponsible = async (
  data: VehicleResponsibleInput,
): Promise<VehicleResponsible | null> => {
  const { vehicleId, userId, startDate, endDate = null } = data;
  await validateUserExists(userId);
  await validateVehicleExists(vehicleId);
  const vehicle = await vehicleRepo().findOne({ where: { id: vehicleId } });
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!vehicle || !user) return null;
  if (endDate !== null) await assertNoOverlap(vehicleId, startDate, endDate);
  if (endDate === null) {
    // close previous active
    const previousEnd = new Date(
      new Date(startDate).getTime() - 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0];
    const active = await repo().find({
      where: { vehicle: { id: vehicleId }, endDate: IsNull() },
    });
    for (const a of active) {
      a.endDate = previousEnd;
      a.updatedAt = new Date();
      await repo().save(a);
    }
  }
  const created = repo().create({ vehicle, user, startDate, endDate });
  const saved = await repo().save(created);
  return {
    id: saved.id,
    vehicleId: saved.vehicle.id,
    userId: saved.user.id,
    startDate: saved.startDate,
    endDate: saved.endDate,
    createdAt: saved.createdAt.toISOString(),
    updatedAt: saved.updatedAt.toISOString(),
  };
};

export const updateVehicleResponsible = async (
  id: string,
  data: Partial<VehicleResponsibleInput>,
): Promise<VehicleResponsible | null> => {
  const ent = await repo().findOne({
    where: { id },
    relations: ["vehicle", "user"],
  });
  if (!ent) return null;
  if (data.userId) {
    await validateUserExists(data.userId);
    const u = await userRepo().findOne({ where: { id: data.userId } });
    if (u) ent.user = u;
  }
  if (data.startDate !== undefined) ent.startDate = data.startDate;
  if (data.endDate !== undefined) ent.endDate = data.endDate ?? null;
  if (ent.endDate === null) {
    // close others
    const previousEnd = new Date(
      new Date(ent.startDate).getTime() - 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0];
    const others = await repo().find({
      where: { vehicle: { id: ent.vehicle.id }, endDate: IsNull() },
    });
    for (const o of others.filter((o) => o.id !== ent.id)) {
      o.endDate = previousEnd;
      o.updatedAt = new Date();
      await repo().save(o);
    }
  } else if (ent.endDate) {
    await assertNoOverlap(ent.vehicle.id, ent.startDate, ent.endDate, ent.id);
  }
  ent.updatedAt = new Date();
  const saved = await repo().save(ent);
  return {
    id: saved.id,
    vehicleId: saved.vehicle.id,
    userId: saved.user.id,
    startDate: saved.startDate,
    endDate: saved.endDate,
    createdAt: saved.createdAt.toISOString(),
    updatedAt: saved.updatedAt.toISOString(),
  };
};

export const deleteVehicleResponsible = async (
  id: string,
): Promise<boolean> => {
  const res = await repo().delete(id);
  return res.affected === 1;
};
