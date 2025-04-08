import { some } from "../../../db";
import { MaintenanceRecord } from "../../../interfaces/vehicles/maintenance/maintenance_record";

const BASE_SELECT = `
    SELECT
        mr.id,
        mr.user_id as userId,
        mr.date,
        mr.kilometers,
        mr.notes,
        mr.assigned_maintenance_id,
        am.vehicle_id as vehicleId,
        m.name as maintenanceName,
        mc.name as maintenanceCategoryName
    FROM
        maintenance_record as mr
        INNER JOIN
            assigned_maintenance as am
        ON
            mr.assigned_maintenance_id = am.id
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
    INSERT INTO maintenance_record
        (user_id, date, kilometers, notes, assigned_maintenance_id)
    VALUES ($1, $2, $3, $4, $5)
    `;

export const getAllMaintenanceRecords = async () => {
  const query = `${BASE_SELECT}`;
  const maintenanceRecords = await some(query, []);
  return maintenanceRecords;
};

export const getMaintenanceRecordsByAssignedMaintenanceId = async (
  assignedMaintenanceId: number,
) => {
  const query = `${BASE_SELECT} WHERE mr.assigned_maintenance_id = $1`;
  const maintenanceRecords = await some(query, [assignedMaintenanceId]);
  return maintenanceRecords;
};

export const addMaintenanceRecord = async (
  maintenanceRecord: MaintenanceRecord,
) => {
  const query = `${BASE_INSERT} RETURNING *`;
  const values = [
    maintenanceRecord.userId,
    maintenanceRecord.date,
    maintenanceRecord.kilometer,
    maintenanceRecord.notes,
    maintenanceRecord.assignedMaintenanceId,
  ];
  const [newMaintenanceRecord] = await some(query, values);
  return newMaintenanceRecord;
};
