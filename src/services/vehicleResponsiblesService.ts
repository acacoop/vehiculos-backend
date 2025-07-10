import { oneOrNone, some } from "../db";
import { VehicleResponsible, VehicleResponsibleWithDetails, VehicleResponsibleInput } from "../interfaces/vehicleResponsible";
import { AppError } from "../middleware/errorHandler";
import { validateUserExists, validateVehicleExists } from "../utils/validators";

export const BASE_SELECT = `
  SELECT 
    id, 
    vehicle_id as "vehicleId", 
    user_id as "userId", 
    start_date as "startDate", 
    end_date as "endDate",
    created_at as "createdAt",
    updated_at as "updatedAt"
  FROM vehicle_responsibles
`;

export const BASE_SELECT_WITH_DETAILS = `
  SELECT 
    vr.id,
    vr.start_date as "startDate",
    vr.end_date as "endDate",
    vr.created_at as "createdAt",
    vr.updated_at as "updatedAt",
    u.id as "user_id",
    u.first_name as "user_firstName",
    u.last_name as "user_lastName",
    u.dni as "user_dni",
    u.email as "user_email",
    u.active as "user_active",
    v.id as "vehicle_id",
    v.license_plate as "vehicle_licensePlate",
    v.brand as "vehicle_brand",
    v.model as "vehicle_model",
    v.year as "vehicle_year",
    v.img_url as "vehicle_imgUrl"
  FROM vehicle_responsibles vr
  INNER JOIN users u ON vr.user_id = u.id
  INNER JOIN vehicles v ON vr.vehicle_id = v.id
`;

interface VehicleResponsibleRow {
  id: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  user_id: string;
  user_firstName: string;
  user_lastName: string;
  user_dni: number;
  user_email: string;
  user_active: boolean;
  vehicle_id: string;
  vehicle_licensePlate: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_imgUrl: string;
}

const mapRowToVehicleResponsibleWithDetails = (row: VehicleResponsibleRow): VehicleResponsibleWithDetails => ({
  id: row.id,
  startDate: row.startDate,
  endDate: row.endDate,
  user: {
    id: row.user_id,
    firstName: row.user_firstName,
    lastName: row.user_lastName,
    dni: row.user_dni,
    email: row.user_email,
    active: row.user_active
  },
  vehicle: {
    id: row.vehicle_id,
    licensePlate: row.vehicle_licensePlate,
    brand: row.vehicle_brand,
    model: row.vehicle_model,
    year: row.vehicle_year,
    imgUrl: row.vehicle_imgUrl
  }
});

// Get all vehicle responsibles with optional filters
export const getAllVehicleResponsibles = async (options?: { 
  limit?: number; 
  offset?: number; 
  searchParams?: Record<string, string>;
}): Promise<{ items: VehicleResponsibleWithDetails[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  
  // Build WHERE clause based on search parameters
  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (searchParams) {
    if (searchParams.vehicleId) {
      whereConditions.push(`vr.vehicle_id = $${paramIndex++}`);
      params.push(searchParams.vehicleId);
    }
    if (searchParams.userId) {
      whereConditions.push(`vr.user_id = $${paramIndex++}`);
      params.push(searchParams.userId);
    }
    if (searchParams.active === 'true') {
      whereConditions.push(`vr.end_date IS NULL`);
    } else if (searchParams.active === 'false') {
      whereConditions.push(`vr.end_date IS NOT NULL`);
    }
    if (searchParams.date) {
      // Find responsibles active on a specific date
      whereConditions.push(`vr.start_date <= $${paramIndex++} AND (vr.end_date IS NULL OR vr.end_date >= $${paramIndex++})`);
      params.push(searchParams.date, searchParams.date);
    }
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM vehicle_responsibles vr${whereClause}`;
  const countResult = await oneOrNone<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = `${BASE_SELECT_WITH_DETAILS}${whereClause} ORDER BY vr.start_date DESC`;
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
  }
  
  const rows = await some<VehicleResponsibleRow>(sql, params);
  const items = rows.map(mapRowToVehicleResponsibleWithDetails);
  
  return { items, total };
};

// Get vehicle responsible by ID
export const getVehicleResponsibleById = async (id: string): Promise<VehicleResponsibleWithDetails | null> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE vr.id = $1`;
  const row = await oneOrNone<VehicleResponsibleRow>(sql, [id]);
  return row ? mapRowToVehicleResponsibleWithDetails(row) : null;
};

// Get current responsible for a vehicle
export const getCurrentResponsibleForVehicle = async (vehicleId: string): Promise<VehicleResponsibleWithDetails | null> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE vr.vehicle_id = $1 AND vr.end_date IS NULL`;
  const row = await oneOrNone<VehicleResponsibleRow>(sql, [vehicleId]);
  return row ? mapRowToVehicleResponsibleWithDetails(row) : null;
};

// Get responsible for a vehicle on a specific date
export const getResponsibleForVehicleOnDate = async (vehicleId: string, date: string): Promise<VehicleResponsibleWithDetails | null> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} 
    WHERE vr.vehicle_id = $1 
    AND vr.start_date <= $2 
    AND (vr.end_date IS NULL OR vr.end_date >= $2)`;
  const row = await oneOrNone<VehicleResponsibleRow>(sql, [vehicleId, date]);
  return row ? mapRowToVehicleResponsibleWithDetails(row) : null;
};

// Get all vehicles currently under a user's responsibility
export const getCurrentVehiclesForUser = async (userId: string): Promise<VehicleResponsibleWithDetails[]> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE vr.user_id = $1 AND vr.end_date IS NULL ORDER BY vr.start_date DESC`;
  const rows = await some<VehicleResponsibleRow>(sql, [userId]);
  return rows.map(mapRowToVehicleResponsibleWithDetails);
};

// Get all vehicles for a user on a specific date
export const getVehiclesForUserOnDate = async (userId: string, date: string): Promise<VehicleResponsibleWithDetails[]> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} 
    WHERE vr.user_id = $1 
    AND vr.start_date <= $2 
    AND (vr.end_date IS NULL OR vr.end_date >= $2)
    ORDER BY vr.start_date DESC`;
  const rows = await some<VehicleResponsibleRow>(sql, [userId, date]);
  return rows.map(mapRowToVehicleResponsibleWithDetails);
};

// Create a new vehicle responsible (will auto-close previous active one)
// Helper function to check for overlapping periods
const checkForOverlap = async (vehicleId: string, startDate: string, endDate: string | null, excludeId?: string): Promise<void> => {
  const checkSql = `
    SELECT id, start_date, end_date 
    FROM vehicle_responsibles 
    WHERE vehicle_id = $1 
    ${excludeId ? 'AND id != $4' : ''}
    AND (
      -- New period starts before existing period ends (or existing has no end)
      ($2 < COALESCE(end_date, '9999-12-31'::date))
      AND
      -- New period ends after existing period starts (or new has no end)
      (COALESCE($3, '9999-12-31'::date) > start_date)
    )
  `;
  
  const params = excludeId ? [vehicleId, startDate, endDate, excludeId] : [vehicleId, startDate, endDate];
  const overlapping = await some<{id: string; start_date: string; end_date: string | null}>(checkSql, params);
  
  if (overlapping.length > 0) {
    const conflict = overlapping[0];
    throw new AppError(
      `Vehicle already has a responsible assigned for the overlapping period (${conflict.start_date} to ${conflict.end_date || 'present'})`,
      400,
      'https://example.com/problems/overlap-error',
      'Vehicle Responsibility Overlap'
    );
  }
};

export const addVehicleResponsible = async (data: VehicleResponsibleInput): Promise<VehicleResponsible | null> => {
  const { vehicleId, userId, startDate, endDate = null } = data;
  
  // Validate that user and vehicle exist
  await validateUserExists(userId);
  await validateVehicleExists(vehicleId);
  
  // If this is an active responsibility (endDate is null), auto-close previous active ones
  if (endDate === null) {
    // Calculate the end date for previous responsibility (day before new start date)
    const previousEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Close any existing active responsibility for this vehicle
    const updateSql = `
      UPDATE vehicle_responsibles 
      SET end_date = $1, updated_at = CURRENT_TIMESTAMP
      WHERE vehicle_id = $2 AND end_date IS NULL
    `;
    await some(updateSql, [previousEndDate, vehicleId]);
  } else {
    // If this is a fixed-term responsibility, check for overlaps
    await checkForOverlap(vehicleId, startDate, endDate);
  }
  
  // Insert the new responsibility
  const insertSql = `
    INSERT INTO vehicle_responsibles (vehicle_id, user_id, start_date, end_date) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id, vehicle_id as "vehicleId", user_id as "userId", start_date as "startDate", end_date as "endDate"
  `;
  const params = [vehicleId, userId, startDate, endDate];
  
  return await oneOrNone<VehicleResponsible>(insertSql, params);
};

// Update a vehicle responsible
export const updateVehicleResponsible = async (id: string, data: Partial<VehicleResponsibleInput>): Promise<VehicleResponsible | null> => {
  // Get current record to check for changes
  const current = await oneOrNone<VehicleResponsible & { vehicleId: string }>(`${BASE_SELECT} WHERE id = $1`, [id]);
  if (!current) {
    return null;
  }

  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.userId !== undefined) {
    fields.push(`user_id = $${paramIndex++}`);
    params.push(data.userId);
  }
  if (data.startDate !== undefined) {
    fields.push(`start_date = $${paramIndex++}`);
    params.push(data.startDate);
  }
  if (data.endDate !== undefined) {
    fields.push(`end_date = $${paramIndex++}`);
    params.push(data.endDate);
  }

  if (fields.length === 0) {
    // No fields to update, return current record
    return current;
  }

  // Check for overlaps if dates are being changed
  if (data.startDate !== undefined || data.endDate !== undefined) {
    const newStartDate = data.startDate || current.startDate;
    const newEndDate = data.endDate !== undefined ? data.endDate : current.endDate;
    
    // If the new responsibility becomes active (endDate becomes null), auto-close others
    if (newEndDate === null && current.endDate !== null) {
      // This responsibility is becoming active, close other active ones
      const previousEndDate = new Date(new Date(newStartDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const updateSql = `
        UPDATE vehicle_responsibles 
        SET end_date = $1, updated_at = CURRENT_TIMESTAMP
        WHERE vehicle_id = $2 AND end_date IS NULL AND id != $3
      `;
      await some(updateSql, [previousEndDate, current.vehicleId, id]);
    } else if (newEndDate !== null) {
      // Check for overlaps only if it's not becoming an active responsibility
      await checkForOverlap(current.vehicleId, newStartDate, newEndDate, id);
    }
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);
  
  const sql = `
    UPDATE vehicle_responsibles 
    SET ${fields.join(', ')} 
    WHERE id = $${paramIndex} 
    RETURNING id, vehicle_id as "vehicleId", user_id as "userId", start_date as "startDate", end_date as "endDate"
  `;
  
  return await oneOrNone<VehicleResponsible>(sql, params);
};

// Delete a vehicle responsible
export const deleteVehicleResponsible = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM vehicle_responsibles WHERE id = $1`;
  const result = await some(sql, [id]);
  return Array.isArray(result);
};
