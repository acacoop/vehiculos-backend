import { oneOrNone, some } from "../db";
import { Reservation } from "../interfaces/reservation";

export const BASE_SELECT =
  "SELECT id, user_id as userId, vehicle_id as vehicleId, start_date as startDate, end_date as endDate, reccurence_pattern as reccurence FROM reservations";

export const getAllReservations = async (): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT}`;
  return some<Reservation>(sql);
};

export const getReservationsByUserId = async (
  userId: number
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1`;
  return some<Reservation>(sql, [userId]);
};

export const getReservationsByVehicleId = async (
  vehicleId: number
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE vehicle_id = $1`;
  return some<Reservation>(sql, [vehicleId]);
};

export const getReservatiosOfAssignedVehiclesByUserId = async (
  userId: number
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE vehicle_id IN (SELECT vehicle_id FROM assignments WHERE user_id = $1)`;
  return some<Reservation>(sql, [userId]);
};

export const getTodayReservationsByUserId = async (
  userId: number
): Promise<Reservation[]> => {
  const sql = `${BASE_SELECT} WHERE user_id = $1 AND start_date = CURRENT_DATE`;
  return some<Reservation>(sql, [userId]);
};

export const addReservation = async (
  reservation: Reservation
): Promise<Reservation | null> => {
  const { userId, vehicleId, startDate, endDate, reccurence } = reservation;
  const sql = `INSERT INTO reservations (user_id, vehicle_id, start_date, end_date, reccurence_pattern) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const params = [userId, vehicleId, startDate, endDate, reccurence];
  return oneOrNone<Reservation>(sql, params);
};
