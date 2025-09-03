import { AppDataSource } from "../../db";
import { Assignment as AssignmentEntity } from "../../entities/Assignment";
import { User as UserEntity } from "../../entities/User";
import { Vehicle as VehicleEntity } from "../../entities/Vehicle";
import type { Assignment } from "../../schemas/assignment";
// Local composite type previously from ../../types
export interface AssignmentWithDetails {
  id: string;
  startDate: string;
  endDate?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    dni: number;
    email: string;
    active: boolean;
    entraId: string;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
  };
}
import {
  validateUserExists,
  validateVehicleExists,
} from "../../utils/validators";
import { validateISODateFormat } from "../../utils/dateValidators";

const repo = () => AppDataSource.getRepository(AssignmentEntity);
const userRepo = () => AppDataSource.getRepository(UserEntity);
const vehicleRepo = () => AppDataSource.getRepository(VehicleEntity);

function mapEntityToDetails(a: AssignmentEntity): AssignmentWithDetails {
  return {
    id: a.id,
    startDate: a.startDate,
    endDate: a.endDate ?? undefined,
    user: {
      id: a.user.id,
      firstName: a.user.firstName,
      lastName: a.user.lastName,
      dni: a.user.dni,
      email: a.user.email,
      active: a.user.active,
      entraId: a.user.entraId,
    },
    vehicle: {
      id: a.vehicle.id,
      licensePlate: a.vehicle.licensePlate,
      brand: a.vehicle.brand,
      model: a.vehicle.model,
      year: a.vehicle.year,
    },
  };
}

export const getAllAssignments = async (options?: {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}): Promise<{ items: AssignmentWithDetails[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  const where: Record<string, unknown> = {};
  if (searchParams?.userId) where.user = { id: searchParams.userId };
  if (searchParams?.vehicleId) where.vehicle = { id: searchParams.vehicleId };
  const [list, total] = await repo().findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { startDate: "DESC" },
  });
  return { items: list.map(mapEntityToDetails), total };
};

export const getAssignmentsByUserId = async (
  userId: string,
): Promise<Assignment[]> => {
  const list = await repo().find({
    where: { user: { id: userId } },
    order: { startDate: "DESC" },
  });
  return list.map((a) => ({
    id: a.id,
    userId: a.user.id,
    vehicleId: a.vehicle.id,
    startDate: a.startDate,
    endDate: a.endDate ?? undefined,
  }));
};

export const getAssignmentsByVehicleId = async (
  vehicleId: string,
): Promise<Assignment[]> => {
  const list = await repo().find({
    where: { vehicle: { id: vehicleId } },
    order: { startDate: "DESC" },
  });
  return list.map((a) => ({
    id: a.id,
    userId: a.user.id,
    vehicleId: a.vehicle.id,
    startDate: a.startDate,
    endDate: a.endDate ?? undefined,
  }));
};

export const getVehiclesAssignedByUserId = async (userId: string) => {
  const list = await repo().find({
    where: { user: { id: userId } },
    relations: ["vehicle"],
    order: { startDate: "DESC" },
  });
  return list.map((a) => ({
    id: a.vehicle.id,
    licensePlate: a.vehicle.licensePlate,
    brand: a.vehicle.brand,
    model: a.vehicle.model,
    year: a.vehicle.year,
  }));
};

export const getUsersAssignedByVehicleId = async (vehicleId: string) => {
  const list = await repo().find({
    where: { vehicle: { id: vehicleId } },
    relations: ["user"],
    order: { startDate: "DESC" },
  });
  return list.map((a) => ({
    id: a.user.id,
    firstName: a.user.firstName,
    lastName: a.user.lastName,
    dni: a.user.dni,
    email: a.user.email,
    active: a.user.active,
  }));
};

export const isVehicleAssignedToUser = async (
  userId: string,
  vehicleId: string,
): Promise<boolean> => {
  const count = await repo().count({
    where: { user: { id: userId }, vehicle: { id: vehicleId } },
  });
  return count > 0;
};

export const addAssignment = async (
  assignment: Omit<Assignment, "id">,
): Promise<Assignment | null> => {
  const { userId, vehicleId, startDate, endDate } = assignment;
  await validateUserExists(userId);
  await validateVehicleExists(vehicleId);
  if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
    throw new Error("End date must be after start date.");
  }
  const user = await userRepo().findOne({ where: { id: userId } });
  const vehicle = await vehicleRepo().findOne({ where: { id: vehicleId } });
  if (!user || !vehicle) return null; // race condition guard
  const created = repo().create({
    user,
    vehicle,
    startDate: startDate || new Date().toISOString().split("T")[0],
    endDate: endDate ?? null,
  });
  const saved = await repo().save(created);
  return {
    id: saved.id,
    userId: saved.user.id,
    vehicleId: saved.vehicle.id,
    startDate: saved.startDate,
    endDate: saved.endDate ?? undefined,
  };
};

export const updateAssignment = async (
  id: string,
  assignment: Partial<Assignment>,
): Promise<AssignmentWithDetails | null> => {
  const entity = await repo().findOne({ where: { id } });
  if (!entity) return null;
  if (assignment.userId) {
    await validateUserExists(assignment.userId);
    const user = await userRepo().findOne({ where: { id: assignment.userId } });
    if (user) entity.user = user;
  }
  if (assignment.vehicleId) {
    await validateVehicleExists(assignment.vehicleId);
    const vehicle = await vehicleRepo().findOne({
      where: { id: assignment.vehicleId },
    });
    if (vehicle) entity.vehicle = vehicle;
  }
  if (assignment.startDate !== undefined) {
    validateISODateFormat(assignment.startDate, "startDate");
    entity.startDate = assignment.startDate;
  }
  if (assignment.endDate !== undefined) {
    if (assignment.endDate)
      validateISODateFormat(assignment.endDate, "endDate");
    entity.endDate = assignment.endDate ?? null;
  }
  if (
    entity.endDate &&
    new Date(entity.endDate) <= new Date(entity.startDate)
  ) {
    throw new Error("End date must be after start date.");
  }
  const saved = await repo().save(entity);
  return mapEntityToDetails(saved);
};

export const getAssignmentById = async (
  id: string,
): Promise<Assignment | null> => {
  const a = await repo().findOne({ where: { id } });
  return a
    ? {
        id: a.id,
        userId: a.user.id,
        vehicleId: a.vehicle.id,
        startDate: a.startDate,
        endDate: a.endDate ?? undefined,
      }
    : null;
};

export const getAssignmentWithDetailsById = async (
  id: string,
): Promise<AssignmentWithDetails | null> => {
  const a = await repo().findOne({ where: { id } });
  return a ? mapEntityToDetails(a) : null;
};

export const finishAssignment = async (
  id: string,
  endDate?: string,
): Promise<AssignmentWithDetails | null> => {
  const entity = await repo().findOne({ where: { id } });
  if (!entity) return null;
  const finalEnd = endDate || new Date().toISOString().split("T")[0];
  if (entity.startDate && new Date(finalEnd) <= new Date(entity.startDate))
    throw new Error("End date must be after start date.");
  entity.endDate = finalEnd;
  const saved = await repo().save(entity);
  return mapEntityToDetails(saved);
};

export const deleteAssignment = async (_id: string): Promise<boolean> => {
  // Not supported (kept for interface parity). Always false.
  return false;
};
