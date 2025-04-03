import { oneOrNone, some } from "../../db";
import { Assignment } from "../../interfaces/vehicles/assignment";
import { BASE_SELECT as VEHICLES_BASE_SELECT } from "./vehiclesService";
import { Vehicle } from "../../interfaces/vehicles/vehicle";
import { BASE_SELECT as USERS_BASE_SELECT } from "../usersService";
import { User } from "../../interfaces/user";

export const BASE_SELECT =
  "SELECT id, vehicle_id as vehicleId, user_id as userId FROM assignments";

export const getAllAssignments = async (): Promise<Assignment[]> => {
  const sql = `${BASE_SELECT}`;
  return some<Assignment>(sql);
};

export const getAssignmentsByUserId = async (
  userId: number,
): Promise<Assignment[]> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1`;
  return some<Assignment>(sql, [userId]);
};

export const getAssignmentsByVehicleId = async (
  vehicleId: number,
): Promise<Assignment[]> => {
  const sql = `${BASE_SELECT} WHERE vehicle_id = $1`;
  return some<Assignment>(sql, [vehicleId]);
};

export const getVehiclesAssignedByUserId = async (
  userId: number,
): Promise<Vehicle[]> => {
  const sql = `
    ${VEHICLES_BASE_SELECT}
    JOIN assignments a ON v.id = a.vehicle_id
    WHERE a.user_id = $1
  `;
  return some<Vehicle>(sql, [userId]);
};

export const getUsersAssignedByVehicleId = async (
  id: number,
): Promise<User[]> => {
  const sql = `
    ${USERS_BASE_SELECT}
    JOIN assignments a ON u.id = a.user_id
    WHERE a.vehicle_id = $1
  `;
  return some<User>(sql, [id]);
};

export const isVehicleAssignedToUser = async (
  userId: number,
  vehicleId: number,
): Promise<boolean> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1 AND vehicle_id = $2`;
  const params = [userId, vehicleId];
  const result = await some<Assignment>(sql, params);
  return result.length > 0;
};

export const addAssignment = async (
  userId: number,
  vehicleId: number,
): Promise<Assignment | null> => {
  const sql = `INSERT INTO assignments (user_id, vehicle_id) VALUES ($1, $2) RETURNING *`;
  const params = [userId, vehicleId];
  return oneOrNone<Assignment>(sql, params);
};
