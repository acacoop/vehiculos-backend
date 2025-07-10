import { some, oneOrNone } from "../../../db";
import { MaintenanceRecord } from "../../../interfaces/maintenance";

const BASE_SELECT = `
    SELECT
        mr.id,
        mr.assigned_maintenance_id as "assignedMaintenanceId",
        mr.user_id as "userId",
        mr.date,
        mr.kilometers,
        mr.notes
    FROM
        maintenance_records mr`;

export const getMaintenanceRecordsByVehicle = async (
  vehicleId: string
): Promise<MaintenanceRecord[]> => {
  const sql = `${BASE_SELECT} 
    INNER JOIN assigned_maintenances am ON mr.assigned_maintenance_id = am.id
    WHERE am.vehicle_id = $1`;
  return some<MaintenanceRecord>(sql, [vehicleId]);
};

export const getMaintenanceRecordById = async (
  id: string
): Promise<MaintenanceRecord | null> => {
  const sql = `${BASE_SELECT} WHERE mr.id = $1`;
  return oneOrNone<MaintenanceRecord>(sql, [id]);
};

export const addMaintenanceRecord = async (
  maintenanceRecord: MaintenanceRecord
): Promise<MaintenanceRecord | null> => {
  const { assignedMaintenanceId, userId, date, kilometers, notes } = maintenanceRecord;
  
  const query = `INSERT INTO maintenance_records (assigned_maintenance_id, user_id, date, kilometers, notes) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id, assigned_maintenance_id as "assignedMaintenanceId", user_id as "userId", date, kilometers, notes`;
  const params = [assignedMaintenanceId, userId, date, kilometers, notes];
  
  return oneOrNone<MaintenanceRecord>(query, params);
};

export const getAllMaintenanceRecords = async (): Promise<MaintenanceRecord[]> => {
  const sql = `${BASE_SELECT}`;
  return some<MaintenanceRecord>(sql);
};

export const getMaintenanceRecordsByAssignedMaintenanceId = async (
  assignedMaintenanceId: string
): Promise<MaintenanceRecord[]> => {
  const sql = `${BASE_SELECT} WHERE mr.assigned_maintenance_id = $1`;
  return some<MaintenanceRecord>(sql, [assignedMaintenanceId]);
};
