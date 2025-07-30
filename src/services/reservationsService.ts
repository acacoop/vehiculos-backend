import { oneOrNone, some } from "../db";
import { Reservation } from "../interfaces/reservation";
import { validateUserExists, validateVehicleExists } from "../utils/validators";

export const BASE_SELECT =
  'SELECT id, user_id as "userId", vehicle_id as "vehicleId", start_date as "startDate", end_date as "endDate" FROM reservations';

export const getAllReservations = async (options?: { 
  limit?: number; 
  offset?: number; 
  searchParams?: Record<string, string>;
}): Promise<{ items: Reservation[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  
  // Build WHERE clause based on search parameters
  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (searchParams) {
    if (searchParams.userId) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      params.push(searchParams.userId);
    }
    if (searchParams.vehicleId) {
      whereConditions.push(`vehicle_id = $${paramIndex++}`);
      params.push(searchParams.vehicleId);
    }
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM reservations${whereClause}`;
  const countResult = await oneOrNone<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = `${BASE_SELECT}${whereClause} ORDER BY start_date DESC`;
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
  }
  
  const items = await some<Reservation>(sql, params);
  
  return { items, total };
};

export const getReservationsByUserId = async (
  userId: string
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1`;
  return some<Reservation>(sql, [userId]);
};

export const getReservationsByVehicleId = async (
  vehicleId: string
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE vehicle_id = $1`;
  return some<Reservation>(sql, [vehicleId]);
};

export const getReservatiosOfAssignedVehiclesByUserId = async (
  userId: string
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE vehicle_id IN (SELECT vehicle_id FROM assignments WHERE user_id = $1)`;
  return some<Reservation>(sql, [userId]);
};

export const getTodayReservationsByUserId = async (
  userId: string
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1 AND start_date = CURRENT_DATE`;
  return some<Reservation>(sql, [userId]);
};

export const addReservation = async (
  reservation: Reservation
): Promise<Reservation | null> => {
  const { userId, vehicleId, startDate, endDate } = reservation;
  
  // Validate that user and vehicle exist
  await validateUserExists(userId);
  await validateVehicleExists(vehicleId);
  
  const sql = `INSERT INTO reservations (user_id, vehicle_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING id, user_id as "userId", vehicle_id as "vehicleId", start_date as "startDate", end_date as "endDate"`;
  const params = [userId, vehicleId, startDate, endDate];
  return oneOrNone<Reservation>(sql, params);
};
