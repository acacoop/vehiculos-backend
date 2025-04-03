import { some, oneOrNone } from "../../../db";
import { AssignedMaintenance } from "../../../interfaces/vehicles/maintenance/assigned_maintenance";

const BASE_SELECT = `SELECT 
    am.id,
    am.vehicle_id as vehicleId,
    m.name as maintenanceName,
    m.img_name as maintenanceImgName,
    mc.name as maintenanceCategoryName,
    am.kilometers_frequency as kilometersFrequency, 
    am.recurrence_pattern as recurrencePattern 
  FROM 
    assigned_maintenance as am 
    INNER JOIN 
      maintenance as m 
    ON 
      am.maintenance_id = m.id 
    INNER JOIN 
      maintenance_category as mc 
    ON 
      m.category_id = mc.id
  `;

const BASE_INSERT = `
  INSERT INTO 
    assigned_maintenance 
    (vehicle_id, maintenance_id, kilometers_frequency, recurrence_pattern) 
  VALUES 
    ($1, $2, $3, $4)
`;

export const getMaintenancesByVehicleId = async (vehicleId: number) => {
  const query = `${BASE_SELECT} WHERE am.vehicle_id = $1`;
  const params = [vehicleId];
  const maintenanceRecords = await some(query, params);
  return maintenanceRecords;
};

export const associateMaintenanceWithVehicle = async (
  assignedMaintenance: AssignedMaintenance,
) => {
  const { vehicleId, maintenanceId, kilometersFrequency, recurrencePattern } =
    assignedMaintenance;

  const query = `${BASE_INSERT}`;
  const params = [
    vehicleId,
    maintenanceId,
    kilometersFrequency,
    recurrencePattern,
  ];
  await oneOrNone(query, params);
};
