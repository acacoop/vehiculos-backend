import { AppDataSource } from "../../../db";
import { AssignedMaintenance as AssignedMaintenanceEntity } from "../../../entities/AssignedMaintenance";
import { Maintenance } from "../../../entities/Maintenance";
import { Vehicle } from "../../../entities/Vehicle";
import type { AssignedMaintenance } from "../../../schemas/maintenance/assignMaintance";
import {
  validateVehicleExists,
  validateMaintenanceExists,
} from "../../../utils/validators";

const repo = () => AppDataSource.getRepository(AssignedMaintenanceEntity);
const maintenanceRepo = () => AppDataSource.getRepository(Maintenance);
const vehicleRepo = () => AppDataSource.getRepository(Vehicle);

// Extend base AssignedMaintenance with maintenance metadata (composite view model)
type AssignedMaintenanceWithMeta = AssignedMaintenance & {
  maintenance_name: string;
  maintenance_category_name?: string;
  maintenance_observations?: string;
  maintenance_instructions?: string;
};

const mapEntity = (
  am: AssignedMaintenanceEntity,
): AssignedMaintenanceWithMeta => ({
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
});

export const getAssignedMaintenancesByVehicle = async (
  vehicleId: string,
): Promise<AssignedMaintenanceWithMeta[]> => {
  const list = await repo().find({
    where: { vehicle: { id: vehicleId } },
    relations: ["maintenance", "maintenance.category", "vehicle"],
  });
  return list.map(mapEntity);
};

export const getAssignedMaintenanceById = async (
  id: string,
): Promise<AssignedMaintenanceWithMeta | null> => {
  const found = await repo().findOne({
    where: { id },
    relations: ["maintenance", "maintenance.category", "vehicle"],
  });
  return found ? mapEntity(found) : null;
};

export const assignMaintenance = async (
  assignedMaintenance: AssignedMaintenance,
): Promise<AssignedMaintenanceWithMeta | null> => {
  const {
    vehicleId,
    maintenanceId,
    kilometersFrequency,
    daysFrequency,
    observations,
    instructions,
  } = assignedMaintenance;
  await validateVehicleExists(vehicleId);
  await validateMaintenanceExists(maintenanceId);
  const vehicle = await vehicleRepo().findOne({ where: { id: vehicleId } });
  const maintenance = await maintenanceRepo().findOne({
    where: { id: maintenanceId },
    relations: ["category"],
  });
  if (!vehicle || !maintenance) return null;
  const created = repo().create({
    vehicle,
    maintenance,
    kilometersFrequency: kilometersFrequency ?? null,
    daysFrequency: daysFrequency ?? null,
    observations: observations ?? null,
    instructions: instructions ?? null,
  });
  const saved = await repo().save(created);
  return mapEntity(saved);
};

export const updateAssignedMaintenance = async (
  id: string,
  updateData: Partial<
    Pick<
      AssignedMaintenance,
      "kilometersFrequency" | "daysFrequency" | "observations" | "instructions"
    >
  >,
): Promise<AssignedMaintenance | null> => {
  const existing = await repo().findOne({
    where: { id },
    relations: ["maintenance", "maintenance.category", "vehicle"],
  });
  if (!existing) return null;
  if (updateData.kilometersFrequency !== undefined)
    existing.kilometersFrequency = updateData.kilometersFrequency ?? null;
  if (updateData.daysFrequency !== undefined)
    existing.daysFrequency = updateData.daysFrequency ?? null;
  if (updateData.observations !== undefined)
    existing.observations = updateData.observations ?? null;
  if (updateData.instructions !== undefined)
    existing.instructions = updateData.instructions ?? null;
  const saved = await repo().save(existing);
  return mapEntity(saved);
};

export const deleteAssignedMaintenance = async (
  id: string,
): Promise<boolean> => {
  const res = await repo().delete(id);
  return res.affected === 1;
};
