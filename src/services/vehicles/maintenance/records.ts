import { AppDataSource } from "../../../db";
import { MaintenanceRecord as MaintenanceRecordEntity } from "../../../entities/MaintenanceRecord";
import { AssignedMaintenance } from "../../../entities/AssignedMaintenance";
import { User } from "../../../entities/User";
import type { MaintenanceRecord } from "../../../schemas/maintenance/maintanceRecord";

const repo = () => AppDataSource.getRepository(MaintenanceRecordEntity);
const assignedRepo = () => AppDataSource.getRepository(AssignedMaintenance);
const userRepo = () => AppDataSource.getRepository(User);

const mapEntity = (mr: MaintenanceRecordEntity): MaintenanceRecord => ({
  id: mr.id,
  assignedMaintenanceId: mr.assignedMaintenance.id,
  userId: mr.user.id,
  date: new Date(mr.date),
  kilometers: mr.kilometers,
  notes: mr.notes ?? undefined,
});

export const getMaintenanceRecordsByVehicle = async (
  vehicleId: string,
): Promise<MaintenanceRecord[]> => {
  const list = await repo()
    .createQueryBuilder("mr")
    .leftJoinAndSelect("mr.assignedMaintenance", "am")
    .leftJoinAndSelect("am.vehicle", "v")
    .leftJoinAndSelect("mr.user", "u")
    .where("v.id = :vehicleId", { vehicleId })
    .orderBy("mr.date", "DESC")
    .getMany();
  return list.map(mapEntity);
};

export const getMaintenanceRecordById = async (
  id: string,
): Promise<MaintenanceRecord | null> => {
  const found = await repo().findOne({ where: { id } });
  return found ? mapEntity(found) : null;
};

export const addMaintenanceRecord = async (
  maintenanceRecord: MaintenanceRecord,
): Promise<MaintenanceRecord | null> => {
  const { assignedMaintenanceId, userId, date, kilometers, notes } =
    maintenanceRecord;
  const assigned = await assignedRepo().findOne({
    where: { id: assignedMaintenanceId },
  });
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!assigned || !user) return null;
  const created = repo().create({
    assignedMaintenance: assigned,
    user,
    date: date.toISOString().split("T")[0],
    kilometers,
    notes: notes ?? null,
  });
  const saved = await repo().save(created);
  return mapEntity(saved);
};

export const getAllMaintenanceRecords = async (options?: {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}): Promise<{ items: MaintenanceRecord[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  const qb = repo()
    .createQueryBuilder("mr")
    .leftJoinAndSelect("mr.assignedMaintenance", "am")
    .leftJoinAndSelect("am.vehicle", "v")
    .leftJoinAndSelect("mr.user", "u");
  if (searchParams?.userId)
    qb.andWhere("u.id = :userId", { userId: searchParams.userId });
  if (searchParams?.vehicleId)
    qb.andWhere("v.id = :vehicleId", { vehicleId: searchParams.vehicleId });
  const [entities, total] = await qb
    .orderBy("mr.date", "DESC")
    .skip(offset)
    .take(limit)
    .getManyAndCount();
  return { items: entities.map(mapEntity), total };
};

export const getMaintenanceRecordsByAssignedMaintenanceId = async (
  assignedMaintenanceId: string,
): Promise<MaintenanceRecord[]> => {
  const list = await repo().find({
    where: { assignedMaintenance: { id: assignedMaintenanceId } },
    order: { date: "DESC" },
  });
  return list.map(mapEntity);
};
