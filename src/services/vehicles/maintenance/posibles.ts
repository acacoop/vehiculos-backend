import { some, oneOrNone } from "../../../db";
import {
  Maintenance,
  MaintenanceVehicleAssignment,
} from "../../../interfaces/maintenance";
import { validateMaintenanceCategoryExists } from "../../../utils/validators";

const BASE_SELECT = `
    SELECT
        m.id,
        m.name,
        mc.name as maintenanceCategoryName
    FROM
        maintenances as m
        INNER JOIN
            maintenance_categories as mc
        ON
            m.category_id = mc.id
    `;

const SIMPLE_SELECT = `
    SELECT
        id,
        category_id as "categoryId",
        name
    FROM
        maintenances
    `;

export const getAllMaintenances = async () => {
  const query = `${BASE_SELECT}`;
  const maintenanceRecords = await some(query, []);
  return maintenanceRecords;
};

export const getMaintenanceById = async (
  id: string
): Promise<Maintenance | null> => {
  const query = `${SIMPLE_SELECT} WHERE id = $1`;
  return await oneOrNone<Maintenance>(query, [id]);
};

export const getMaintenanceWithDetailsById = async (id: string) => {
  const query = `${BASE_SELECT} WHERE m.id = $1`;
  return await oneOrNone(query, [id]);
};

export const createMaintenance = async (
  maintenance: Omit<Maintenance, "id">
): Promise<Maintenance | null> => {
  const { categoryId, name } = maintenance;

  // Validate that the category exists
  await validateMaintenanceCategoryExists(categoryId);

  const query = `INSERT INTO maintenances (category_id, name) VALUES ($1, $2) RETURNING id, category_id as "categoryId", name`;
  return await oneOrNone<Maintenance>(query, [categoryId, name]);
};

export const updateMaintenance = async (
  id: string,
  maintenance: Partial<Maintenance>
): Promise<Maintenance | null> => {
  // Validate that the maintenance exists first
  const existingMaintenance = await getMaintenanceById(id);
  if (!existingMaintenance) {
    return null;
  }

  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (maintenance.categoryId !== undefined) {
    // Validate that the category exists
    await validateMaintenanceCategoryExists(maintenance.categoryId);
    fields.push(`category_id = $${paramIndex++}`);
    params.push(maintenance.categoryId);
  }

  if (maintenance.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(maintenance.name);
  }

  if (fields.length === 0) {
    return existingMaintenance;
  }

  params.push(id);
  const query = `UPDATE maintenances SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING id, category_id as "categoryId", name`;

  return await oneOrNone<Maintenance>(query, params);
};

export const deleteMaintenance = async (id: string): Promise<boolean> => {
  // Check if maintenance exists before attempting to delete
  const existingMaintenance = await getMaintenanceById(id);
  if (!existingMaintenance) {
    return false;
  }

  const query = `DELETE FROM maintenances WHERE id = $1`;
  await some(query, [id]);
  return true;
};

// Get all vehicles assigned to a specific maintenance
export const getVehiclesByMaintenanceId = async (
  maintenanceId: string
): Promise<MaintenanceVehicleAssignment[]> => {
  const query = `
    SELECT 
      am.id,
      am.vehicle_id as "vehicleId",
      am.maintenance_id as "maintenanceId",
      am.kilometers_frequency as "kilometersFrequency",
      am.days_frequency as "daysFrequency",
      v.license_plate as "licensePlate",
      v.brand,
      v.model,
      v.year,
      v.img_url as "imgUrl"
    FROM assigned_maintenances am
    INNER JOIN vehicles v ON am.vehicle_id = v.id
    WHERE am.maintenance_id = $1
    ORDER BY v.license_plate ASC
  `;

  return await some<MaintenanceVehicleAssignment>(query, [maintenanceId]);
};
