import { some, oneOrNone } from "../../../db";
import { AssignedMaintenance } from "../../../interfaces/maintenance";
import { validateVehicleExists } from "../../../utils/validators";
import { validateMaintenanceExists } from "../../../utils/validators";

const BASE_SELECT = `SELECT 
    am.id,
    am.vehicle_id as "vehicleId",
    am.maintenance_id as "maintenanceId",
    am.kilometers_frequency as "kilometersFrequency",
    am.days_frequency as "daysFrequency",
    m.name as maintenance_name,
    mc.name as maintenance_category_name
  FROM 
    assigned_maintenances as am 
    INNER JOIN 
      maintenances as m 
    ON 
      am.maintenance_id = m.id 
    INNER JOIN 
      maintenance_categories as mc 
    ON 
      m.category_id = mc.id`;

export const getAssignedMaintenancesByVehicle = async (
  vehicleId: string
): Promise<AssignedMaintenance[]> => {
  const sql = `${BASE_SELECT} WHERE am.vehicle_id = $1`;
  return some<AssignedMaintenance>(sql, [vehicleId]);
};

export const getAssignedMaintenanceById = async (
  id: string
): Promise<AssignedMaintenance | null> => {
  const sql = `${BASE_SELECT} WHERE am.id = $1`;
  return oneOrNone<AssignedMaintenance>(sql, [id]);
};

export const assignMaintenance = async (
  assignedMaintenance: AssignedMaintenance
): Promise<AssignedMaintenance | null> => {
  const { vehicleId, maintenanceId, kilometersFrequency, daysFrequency } =
    assignedMaintenance;

  // Validate that vehicle and maintenance exist
  await validateVehicleExists(vehicleId);
  await validateMaintenanceExists(maintenanceId);

  const query = `INSERT INTO assigned_maintenances (vehicle_id, maintenance_id, kilometers_frequency, days_frequency) 
                 VALUES ($1, $2, $3, $4) RETURNING id, vehicle_id as "vehicleId", maintenance_id as "maintenanceId", kilometers_frequency as "kilometersFrequency", days_frequency as "daysFrequency"`;
  const params = [vehicleId, maintenanceId, kilometersFrequency, daysFrequency];

  return oneOrNone<AssignedMaintenance>(query, params);
};

export const deleteAssignedMaintenance = async (
  id: string
): Promise<boolean> => {
  // Check if the assigned maintenance exists before attempting to delete
  const existingAssignment = await getAssignedMaintenanceById(id);
  if (!existingAssignment) {
    return false;
  }

  const query = `DELETE FROM assigned_maintenances WHERE id = $1`;
  await some(query, [id]);
  return true;
};
