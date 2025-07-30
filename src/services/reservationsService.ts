import { oneOrNone, some } from "../db";
import { Reservation, ReservationWithDetails } from "../interfaces/reservation";
import { validateUserExists, validateVehicleExists } from "../utils/validators";

export const BASE_SELECT =
  'SELECT id, user_id as "userId", vehicle_id as "vehicleId", start_date as "startDate", end_date as "endDate" FROM reservations';

export const BASE_SELECT_WITH_DETAILS = `
  SELECT 
    r.id,
    r.start_date as "startDate",
    r.end_date as "endDate",
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
  FROM reservations r
  INNER JOIN users u ON r.user_id = u.id
  INNER JOIN vehicles v ON r.vehicle_id = v.id
`;

const mapRowToReservationWithDetails = (row: ReservationRow): ReservationWithDetails => ({
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

interface ReservationRow {
  id: string;
  startDate: Date;
  endDate: Date;
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

export const getAllReservations = async (options?: { 
  limit?: number; 
  offset?: number; 
  searchParams?: Record<string, string>;
}): Promise<{ items: ReservationWithDetails[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  
  // Build WHERE clause based on search parameters
  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (searchParams) {
    if (searchParams.userId) {
      whereConditions.push(`r.user_id = $${paramIndex++}`);
      params.push(searchParams.userId);
    }
    if (searchParams.vehicleId) {
      whereConditions.push(`r.vehicle_id = $${paramIndex++}`);
      params.push(searchParams.vehicleId);
    }
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM reservations r${whereClause}`;
  const countResult = await oneOrNone<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = `${BASE_SELECT_WITH_DETAILS}${whereClause} ORDER BY r.start_date DESC`;
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
  }
  
  const rows = await some<ReservationRow>(sql, params);
  const items = rows.map(mapRowToReservationWithDetails);
  
  return { items, total };
};

export const getReservationsByUserId = async (
  userId: string
): Promise<ReservationWithDetails[]> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE r.user_id = $1`;
  const rows = await some<ReservationRow>(sql, [userId]);
  return rows.map(mapRowToReservationWithDetails);
};

export const getReservationsByVehicleId = async (
  vehicleId: string
): Promise<ReservationWithDetails[]> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE r.vehicle_id = $1`;
  const rows = await some<ReservationRow>(sql, [vehicleId]);
  return rows.map(mapRowToReservationWithDetails);
};

export const getReservatiosOfAssignedVehiclesByUserId = async (
  userId: string
): Promise<ReservationWithDetails[]> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE r.vehicle_id IN (SELECT vehicle_id FROM assignments WHERE user_id = $1)`;
  const rows = await some<ReservationRow>(sql, [userId]);
  return rows.map(mapRowToReservationWithDetails);
};

export const getTodayReservationsByUserId = async (
  userId: string
): Promise<ReservationWithDetails[]> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE r.user_id = $1 AND r.start_date = CURRENT_DATE`;
  const rows = await some<ReservationRow>(sql, [userId]);
  return rows.map(mapRowToReservationWithDetails);
};

export const addReservation = async (
  reservation: Reservation
): Promise<ReservationWithDetails | null> => {
  const { userId, vehicleId, startDate, endDate } = reservation;
  
  // Validate that user and vehicle exist
  await validateUserExists(userId);
  await validateVehicleExists(vehicleId);
  
  const insertSql = `INSERT INTO reservations (user_id, vehicle_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING id`;
  const params = [userId, vehicleId, startDate, endDate];
  const result = await oneOrNone<{ id: string }>(insertSql, params);
  
  if (!result) {
    return null;
  }
  
  // Get the full reservation with details
  const getSql = `${BASE_SELECT_WITH_DETAILS} WHERE r.id = $1`;
  const row = await oneOrNone<ReservationRow>(getSql, [result.id]);
  
  return row ? mapRowToReservationWithDetails(row) : null;
};

export const getReservationById = async (
  id: string
): Promise<ReservationWithDetails | null> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE r.id = $1`;
  const row = await oneOrNone<ReservationRow>(sql, [id]);
  return row ? mapRowToReservationWithDetails(row) : null;
};
