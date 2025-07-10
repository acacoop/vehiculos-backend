import { oneOrNone, some } from "../db";
import { Reservation } from "../interfaces/reservation";
import { validateUserExists, validateVehicleExists } from "../utils/validators";

export const BASE_SELECT =
  'SELECT id, user_id as "userId", vehicle_id as "vehicleId", start_date as "startDate", end_date as "endDate" FROM reservations';

export const getAllReservations = async (): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT}`;
  return some<Reservation>(sql);
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
