import { oneOrNone, some } from "../../db";
import { Assignment, AssignmentWithDetails } from "../../interfaces/assignment";
import { BASE_SELECT as VEHICLES_BASE_SELECT } from "./vehiclesService";
import { Vehicle } from "../../interfaces/vehicle";
import { BASE_SELECT as USERS_BASE_SELECT } from "../usersService";
import { User } from "../../interfaces/user";
import { validateUserExists, validateVehicleExists } from "../../utils/validators";
import { validateISODateFormat } from "../../utils/dateValidators";

export const BASE_SELECT =
  'SELECT id, vehicle_id as "vehicleId", user_id as "userId", start_date as "startDate", end_date as "endDate" FROM assignments';

export const BASE_SELECT_WITH_DETAILS = `
  SELECT 
    a.id,
    a.start_date as "startDate",
    a.end_date as "endDate",
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
  FROM assignments a
  INNER JOIN users u ON a.user_id = u.id
  INNER JOIN vehicles v ON a.vehicle_id = v.id
`;

const mapRowToAssignmentWithDetails = (row: AssignmentRow): AssignmentWithDetails => ({
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

interface AssignmentRow {
  id: string;
  startDate: string;
  endDate?: string;
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
  vehicle_imgUrl?: string; // Made optional
}

export const getAllAssignments = async (options?: { 
  limit?: number; 
  offset?: number; 
  searchParams?: Record<string, string>;
}): Promise<{ items: AssignmentWithDetails[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  
  // Build WHERE clause based on search parameters
  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (searchParams) {
    if (searchParams.userId) {
      whereConditions.push(`a.user_id = $${paramIndex++}`);
      params.push(searchParams.userId);
    }
    if (searchParams.vehicleId) {
      whereConditions.push(`a.vehicle_id = $${paramIndex++}`);
      params.push(searchParams.vehicleId);
    }
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM assignments a${whereClause}`;
  const countResult = await oneOrNone<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = `${BASE_SELECT_WITH_DETAILS}${whereClause}`;
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
  }
  
  const rows = await some<AssignmentRow>(sql, params);
  const items = rows.map(mapRowToAssignmentWithDetails);
  
  return { items, total };
};

export const getAssignmentsByUserId = async (
  userId: string,
): Promise<Assignment[]> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1`;
  return some<Assignment>(sql, [userId]);
};

export const getAssignmentsByVehicleId = async (
  vehicleId: string,
): Promise<Assignment[]> => {
  const sql = `${BASE_SELECT} WHERE vehicle_id = $1`;
  return some<Assignment>(sql, [vehicleId]);
};

export const getVehiclesAssignedByUserId = async (
  userId: string,
): Promise<Vehicle[]> => {
  const sql = `
    ${VEHICLES_BASE_SELECT}
    JOIN assignments a ON v.id = a.vehicle_id
    WHERE a.user_id = $1
  `;
  return some<Vehicle>(sql, [userId]);
};

export const getUsersAssignedByVehicleId = async (
  id: string,
): Promise<User[]> => {
  const sql = `
    ${USERS_BASE_SELECT}
    JOIN assignments a ON u.id = a.user_id
    WHERE a.vehicle_id = $1
  `;
  return some<User>(sql, [id]);
};

export const isVehicleAssignedToUser = async (
  userId: string,
  vehicleId: string,
): Promise<boolean> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1 AND vehicle_id = $2`;
  const params = [userId, vehicleId];
  const result = await some<Assignment>(sql, params);
  return result.length > 0;
};

export const addAssignment = async (
  assignment: Omit<Assignment, 'id'>
): Promise<Assignment | null> => {
  const { userId, vehicleId, startDate, endDate } = assignment;
  
  // Validate that user and vehicle exist
  await validateUserExists(userId);
  await validateVehicleExists(vehicleId);
  
  const sql = `INSERT INTO assignments (user_id, vehicle_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING id, user_id as "userId", vehicle_id as "vehicleId", start_date as "startDate", end_date as "endDate"`;
  const params = [userId, vehicleId, startDate || new Date().toISOString().split('T')[0], endDate || null];
  return oneOrNone<Assignment>(sql, params);
};

export const updateAssignment = async (id: string, assignment: Partial<Assignment>): Promise<AssignmentWithDetails | null> => {
  // Validate that the assignment exists first
  const existingAssignment = await getAssignmentById(id);
  if (!existingAssignment) {
    return null;
  }

  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Validate user and vehicle if provided
  if (assignment.userId !== undefined) {
    await validateUserExists(assignment.userId);
    fields.push(`user_id = $${paramIndex++}`);
    params.push(assignment.userId);
  }
  if (assignment.vehicleId !== undefined) {
    await validateVehicleExists(assignment.vehicleId);
    fields.push(`vehicle_id = $${paramIndex++}`);
    params.push(assignment.vehicleId);
  }
  
  // Validate dates if provided
  if (assignment.startDate !== undefined) {
    validateISODateFormat(assignment.startDate, 'startDate');
    fields.push(`start_date = $${paramIndex++}`);
    params.push(assignment.startDate);
  }
  if (assignment.endDate !== undefined) {
    if (assignment.endDate) {
      validateISODateFormat(assignment.endDate, 'endDate');
    }
    fields.push(`end_date = $${paramIndex++}`);
    params.push(assignment.endDate);
  }

  // Validate date logic
  const startDate = assignment.startDate || existingAssignment.startDate;
  const endDate = assignment.endDate !== undefined ? assignment.endDate : existingAssignment.endDate;
  
  if (endDate && new Date(endDate) <= new Date(startDate)) {
    throw new Error('End date must be after start date.');
  }

  if (fields.length === 0) {
    return getAssignmentWithDetailsById(id);
  }

  params.push(id);
  const sql = `UPDATE assignments SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
  
  await some(sql, params);
  
  // Return the updated assignment with details
  return await getAssignmentWithDetailsById(id);
};

export const getAssignmentById = async (id: string): Promise<Assignment | null> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  return await oneOrNone<Assignment>(sql, [id]);
};

export const getAssignmentWithDetailsById = async (id: string): Promise<AssignmentWithDetails | null> => {
  const sql = `${BASE_SELECT_WITH_DETAILS} WHERE a.id = $1`;
  const row = await oneOrNone<AssignmentRow>(sql, [id]);
  return row ? mapRowToAssignmentWithDetails(row) : null;
};

export const finishAssignment = async (id: string, endDate?: string): Promise<AssignmentWithDetails | null> => {
  // Use provided endDate or current date
  const finalEndDate = endDate || new Date().toISOString();
  
  // Use updateAssignment to handle validation and update logic
  return await updateAssignment(id, { endDate: finalEndDate });
};

export const deleteAssignment = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM assignments WHERE id = $1`;
  const result = await some(sql, [id]);
  return Array.isArray(result);
};
