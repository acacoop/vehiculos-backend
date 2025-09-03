import { AppDataSource } from "../../../db";
import { Maintenance as MaintenanceEntity } from "../../../entities/Maintenance";
import { MaintenanceCategory } from "../../../entities/MaintenanceCategory";
import { AssignedMaintenance } from "../../../entities/AssignedMaintenance";
import { validateMaintenanceCategoryExists } from "../../../utils/validators";
import type { Maintenance } from "../../../schemas/maintenance/maintenance";

// Local interface (previously from types)
export interface MaintenanceVehicleAssignment {
  id: string;
  vehicleId: string;
  maintenanceId: string;
  kilometersFrequency?: number;
  daysFrequency?: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
}

const maintenanceRepo = () => AppDataSource.getRepository(MaintenanceEntity);
const assignedRepo = () => AppDataSource.getRepository(AssignedMaintenance);

// Map entity to a Maintenance shape extended with optional extra fields (not yet in zod schema)
const mapMaintenance = (
  m: MaintenanceEntity,
): Maintenance & {
  kilometersFrequency?: number;
  daysFrequency?: number;
  observations?: string;
  instructions?: string;
} => ({
  id: m.id,
  categoryId: m.category.id,
  name: m.name,
  kilometersFrequency: m.kilometersFrequency ?? undefined,
  daysFrequency: m.daysFrequency ?? undefined,
  observations: m.observations ?? undefined,
  instructions: m.instructions ?? undefined,
});

export const getAllMaintenances = async () => {
  const list = await maintenanceRepo().find({
    relations: ["category"],
    order: { name: "ASC" },
  });
  return list.map(mapMaintenance);
};

export const getMaintenanceById = async (
  id: string,
): Promise<Maintenance | null> => {
  const entity = await maintenanceRepo().findOne({
    where: { id },
    relations: ["category"],
  });
  return entity ? mapMaintenance(entity) : null;
};

export const getMaintenanceWithDetailsById = async (id: string) => {
  const entity = await maintenanceRepo().findOne({
    where: { id },
    relations: ["category"],
  });
  if (!entity) return null;
  return {
    ...mapMaintenance(entity),
    maintenanceCategoryName: entity.category.name,
  };
};

export const createMaintenance = async (
  maintenance: Omit<Maintenance, "id"> & {
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
  },
): Promise<Maintenance | null> => {
  await validateMaintenanceCategoryExists(maintenance.categoryId);
  const categoryRef = await AppDataSource.getRepository(
    MaintenanceCategory,
  ).findOne({ where: { id: maintenance.categoryId } });
  if (!categoryRef) return null; // race condition safe-guard
  const created = maintenanceRepo().create({
    category: categoryRef,
    name: maintenance.name,
    kilometersFrequency: maintenance.kilometersFrequency ?? null,
    daysFrequency: maintenance.daysFrequency ?? null,
    observations: maintenance.observations ?? null,
    instructions: maintenance.instructions ?? null,
  });
  const saved = await maintenanceRepo().save(created);
  return mapMaintenance(saved);
};

export const updateMaintenance = async (
  id: string,
  maintenance: Partial<Maintenance> & {
    kilometersFrequency?: number | null;
    daysFrequency?: number | null;
    observations?: string | null;
    instructions?: string | null;
  },
): Promise<Maintenance | null> => {
  const existing = await maintenanceRepo().findOne({
    where: { id },
    relations: ["category"],
  });
  if (!existing) return null;
  if (maintenance.categoryId) {
    await validateMaintenanceCategoryExists(maintenance.categoryId);
    const categoryRef = await AppDataSource.getRepository(
      MaintenanceCategory,
    ).findOne({ where: { id: maintenance.categoryId } });
    if (categoryRef) existing.category = categoryRef;
  }
  if (maintenance.name !== undefined) existing.name = maintenance.name;
  if (maintenance.kilometersFrequency !== undefined)
    existing.kilometersFrequency = maintenance.kilometersFrequency ?? null;
  if (maintenance.daysFrequency !== undefined)
    existing.daysFrequency = maintenance.daysFrequency ?? null;
  if (maintenance.observations !== undefined)
    existing.observations = maintenance.observations ?? null;
  if (maintenance.instructions !== undefined)
    existing.instructions = maintenance.instructions ?? null;
  const saved = await maintenanceRepo().save(existing);
  return mapMaintenance(saved);
};

export const deleteMaintenance = async (id: string): Promise<boolean> => {
  const res = await maintenanceRepo().delete(id);
  return res.affected === 1;
};

export const getVehiclesByMaintenanceId = async (
  maintenanceId: string,
): Promise<MaintenanceVehicleAssignment[]> => {
  const list = await assignedRepo().find({
    where: { maintenance: { id: maintenanceId } },
    relations: ["vehicle", "maintenance", "maintenance.category"],
  });
  return list.map((am) => ({
    id: am.id,
    vehicleId: am.vehicle.id,
    maintenanceId: am.maintenance.id,
    kilometersFrequency: am.kilometersFrequency ?? undefined,
    daysFrequency: am.daysFrequency ?? undefined,
    licensePlate: am.vehicle.licensePlate,
    brand: am.vehicle.brand,
    model: am.vehicle.model,
    year: am.vehicle.year,
  }));
};
