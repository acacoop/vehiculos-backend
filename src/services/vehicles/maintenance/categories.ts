import { AppDataSource } from "../../../db";
import { MaintenanceCategory as MaintenanceCategoryEntity } from "../../../entities/MaintenanceCategory";
import { MaintenanceCategory } from "../../../interfaces/maintenance";

const repo = () => AppDataSource.getRepository(MaintenanceCategoryEntity);

const map = (e: MaintenanceCategoryEntity): MaintenanceCategory => ({
  id: e.id,
  name: e.name,
});

export const getAllMaintenancesCategories = async () => {
  const all = await repo().find({ order: { name: "ASC" } });
  return all.map(map);
};

export const getMaintenanceCategoryById = async (
  id: string,
): Promise<MaintenanceCategory | null> => {
  const found = await repo().findOne({ where: { id } });
  return found ? map(found) : null;
};

export const createMaintenanceCategory = async (
  category: Omit<MaintenanceCategory, "id">,
): Promise<MaintenanceCategory | null> => {
  const created = repo().create({ name: category.name });
  const saved = await repo().save(created);
  return map(saved);
};

export const updateMaintenanceCategory = async (
  id: string,
  category: Partial<MaintenanceCategory>,
): Promise<MaintenanceCategory | null> => {
  const existing = await repo().findOne({ where: { id } });
  if (!existing) return null;
  if (category.name !== undefined) existing.name = category.name;
  const saved = await repo().save(existing);
  return map(saved);
};

export const deleteMaintenanceCategory = async (
  id: string,
): Promise<boolean> => {
  const res = await repo().delete(id);
  return res.affected === 1;
};
