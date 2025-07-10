import { oneOrNone, some } from "../../db";
import { Assignment } from "../../interfaces/assignment";
import { BASE_SELECT as VEHICLES_BASE_SELECT } from "./vehiclesService";
import { Vehicle } from "../../interfaces/vehicle";
import { BASE_SELECT as USERS_BASE_SELECT } from "../usersService";
import { User } from "../../interfaces/user";

export const BASE_SELECT =
  'SELECT id, vehicle_id as "vehicleId", user_id as "userId", start_date as "startDate", end_date as "endDate" FROM assignments';

export const getAllAssignments = async (options?: { 
  userId?: string; 
  vehicleId?: string;
  limit?: number; 
  offset?: number; 
}): Promise<{ items: Assignment[]; total: number }> => {
  const { userId, vehicleId, limit, offset } = options || {};
  
  // Build WHERE clause based on filters
  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (userId) {
    whereConditions.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }
  if (vehicleId) {
    whereConditions.push(`vehicle_id = $${paramIndex++}`);
    params.push(vehicleId);
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM assignments${whereClause}`;
  const countResult = await oneOrNone<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = `${BASE_SELECT}${whereClause}`;
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
  }
  
  const items = await some<Assignment>(sql, params);
  
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
  const sql = `INSERT INTO assignments (user_id, vehicle_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING id, user_id as "userId", vehicle_id as "vehicleId", start_date as "startDate", end_date as "endDate"`;
  const params = [userId, vehicleId, startDate || new Date().toISOString().split('T')[0], endDate || null];
  return oneOrNone<Assignment>(sql, params);
};

export const updateAssignment = async (id: string, assignment: Partial<Assignment>): Promise<Assignment | null> => {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (assignment.userId !== undefined) {
    fields.push(`user_id = $${paramIndex++}`);
    params.push(assignment.userId);
  }
  if (assignment.vehicleId !== undefined) {
    fields.push(`vehicle_id = $${paramIndex++}`);
    params.push(assignment.vehicleId);
  }
  if (assignment.startDate !== undefined) {
    fields.push(`start_date = $${paramIndex++}`);
    params.push(assignment.startDate);
  }
  if (assignment.endDate !== undefined) {
    fields.push(`end_date = $${paramIndex++}`);
    params.push(assignment.endDate);
  }

  if (fields.length === 0) {
    return getAssignmentById(id);
  }

  params.push(id);
  const sql = `UPDATE assignments SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, user_id as "userId", vehicle_id as "vehicleId", start_date as "startDate", end_date as "endDate"`;
  
  return await oneOrNone<Assignment>(sql, params);
};

export const getAssignmentById = async (id: string): Promise<Assignment | null> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  return await oneOrNone<Assignment>(sql, [id]);
};

export const deleteAssignment = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM assignments WHERE id = $1`;
  const result = await some(sql, [id]);
  return Array.isArray(result);
};
