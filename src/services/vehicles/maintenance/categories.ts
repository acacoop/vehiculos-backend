import { some, oneOrNone } from "../../../db";
import { MaintenanceCategory } from "../../../interfaces/maintenance";

const BASE_SELECT = `
    SELECT
        id,
        name
    FROM
        maintenance_categories
    `;

export const getAllMaintenancesCategories = async () => {
  const query = `${BASE_SELECT}`;
  const maintenanceCategoryRecords = await some(query, []);
  return maintenanceCategoryRecords;
};

export const getMaintenanceCategoryById = async (id: string): Promise<MaintenanceCategory | null> => {
  const query = `${BASE_SELECT} WHERE id = $1`;
  return await oneOrNone<MaintenanceCategory>(query, [id]);
};

export const createMaintenanceCategory = async (category: Omit<MaintenanceCategory, 'id'>): Promise<MaintenanceCategory | null> => {
  const { name } = category;
  const query = `INSERT INTO maintenance_categories (name) VALUES ($1) RETURNING id, name`;
  return await oneOrNone<MaintenanceCategory>(query, [name]);
};

export const updateMaintenanceCategory = async (id: string, category: Partial<MaintenanceCategory>): Promise<MaintenanceCategory | null> => {
  // Validate that the category exists first
  const existingCategory = await getMaintenanceCategoryById(id);
  if (!existingCategory) {
    return null;
  }

  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (category.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(category.name);
  }

  if (fields.length === 0) {
    return existingCategory;
  }

  params.push(id);
  const query = `UPDATE maintenance_categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name`;
  
  return await oneOrNone<MaintenanceCategory>(query, params);
};

export const deleteMaintenanceCategory = async (id: string): Promise<boolean> => {
  // Check if category exists before attempting to delete
  const existingCategory = await getMaintenanceCategoryById(id);
  if (!existingCategory) {
    return false;
  }

  const query = `DELETE FROM maintenance_categories WHERE id = $1`;
  await some(query, [id]);
  return true;
};

