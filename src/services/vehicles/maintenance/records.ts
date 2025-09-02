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
  // Allow creation by assignedMaintenanceId OR by providing vehicleId + maintenanceId
  let {
    assignedMaintenanceId,
    vehicleId,
    maintenanceId,
    userId,
    date,
    kilometers,
    notes,
  } = maintenanceRecord as any;

  if (!assignedMaintenanceId) {
    // resolve assignedMaintenanceId from vehicleId + maintenanceId
    const resolveSql = `SELECT id FROM assigned_maintenances WHERE vehicle_id = $1 AND maintenance_id = $2 LIMIT 1`;
    const resolved = await oneOrNone<{ id: string }>(resolveSql, [
      vehicleId,
      maintenanceId,
    ]);
    if (!resolved) {
      throw new Error(
        "No assigned maintenance found for provided vehicleId and maintenanceId"
      );
    }
    assignedMaintenanceId = resolved.id;
  }

  const query = `INSERT INTO maintenance_records (assigned_maintenance_id, user_id, date, kilometers, notes) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id, assigned_maintenance_id as "assignedMaintenanceId", user_id as "userId", date, kilometers, notes`;
  const params = [assignedMaintenanceId, userId, date, kilometers, notes];

  return oneOrNone<MaintenanceRecord>(query, params);
};

export const getAllMaintenanceRecords = async (options?: {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}): Promise<{ items: MaintenanceRecord[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};

  // Build WHERE clause based on search parameters
  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (searchParams) {
    if (searchParams.userId) {
      whereConditions.push(`mr.user_id = $${paramIndex++}`);
      params.push(searchParams.userId);
    }
    if (searchParams.vehicleId) {
      whereConditions.push(`am.vehicle_id = $${paramIndex++}`);
      params.push(searchParams.vehicleId);
    }
    if (searchParams.maintenanceId) {
      whereConditions.push(`am.maintenance_id = $${paramIndex++}`);
      params.push(searchParams.maintenanceId);
    }
  }

  const whereClause =
    whereConditions.length > 0 ? ` WHERE ${whereConditions.join(" AND ")}` : "";

  // Base query with joins to get vehicle information when filtering by vehicleId
  const needsJoin = searchParams?.vehicleId || searchParams?.maintenanceId;

  const baseQuery = needsJoin
    ? `${BASE_SELECT} INNER JOIN assigned_maintenances am ON mr.assigned_maintenance_id = am.id`
    : BASE_SELECT;

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM maintenance_records mr ${
    needsJoin
      ? "INNER JOIN assigned_maintenances am ON mr.assigned_maintenance_id = am.id"
      : ""
  }${whereClause}`;
  const countResult = await oneOrNone<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || "0");

  // Get paginated results
  let sql = `${baseQuery}${whereClause} ORDER BY mr.date DESC`;

  if (limit && offset !== undefined) {
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
  }

  const items = await some<MaintenanceRecord>(sql, params);

  return { items, total };
};

export const getMaintenanceRecordsByAssignedMaintenanceId = async (
  assignedMaintenanceId: string
): Promise<MaintenanceRecord[]> => {
  const sql = `${BASE_SELECT} WHERE mr.assigned_maintenance_id = $1`;
  return some<MaintenanceRecord>(sql, [assignedMaintenanceId]);
};

export const getMaintenanceRecordsByVehicleAndMaintenance = async (
  vehicleId: string,
  maintenanceId: string
): Promise<MaintenanceRecord[]> => {
  const sql = `
    ${BASE_SELECT}
    INNER JOIN assigned_maintenances am ON mr.assigned_maintenance_id = am.id
    WHERE am.vehicle_id = $1 AND am.maintenance_id = $2
    ORDER BY mr.date DESC
  `;
  return some<MaintenanceRecord>(sql, [vehicleId, maintenanceId]);
};
