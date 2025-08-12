import { oneOrNone, some } from '../../db';
import { VehicleKilometersLog } from '../../interfaces/vehicleKilometers';
import { AppError } from '../../middleware/errorHandler';

const BASE_SELECT = `SELECT id, vehicle_id as "vehicleId", user_id as "userId", date, kilometers, created_at as "createdAt" FROM vehicle_kilometers`;

export const getVehicleKilometers = async (vehicleId: string): Promise<VehicleKilometersLog[]> => {
  const sql = `${BASE_SELECT} WHERE vehicle_id = $1 ORDER BY date ASC`;
  return some<VehicleKilometersLog>(sql, [vehicleId]);
};

export const addVehicleKilometers = async (log: VehicleKilometersLog): Promise<VehicleKilometersLog> => {
  // Validation: ensure monotonic consistency relative to previous/next entries.
  // Strategy: fetch closest previous and next logs by date for the vehicle and compare kilometers.
  const prevSql = `${BASE_SELECT} WHERE vehicle_id = $1 AND date < $2 ORDER BY date DESC LIMIT 1`;
  const nextSql = `${BASE_SELECT} WHERE vehicle_id = $1 AND date > $2 ORDER BY date ASC LIMIT 1`;

  const prev = await oneOrNone<VehicleKilometersLog>(prevSql, [log.vehicleId, log.date]);
  const next = await oneOrNone<VehicleKilometersLog>(nextSql, [log.vehicleId, log.date]);

  if (prev && log.kilometers < prev.kilometers) {
    throw new AppError(`Kilometers ${log.kilometers} is less than previous recorded ${prev.kilometers} at ${prev.date.toISOString()}`, 422, 'https://example.com/problems/invalid-kilometers', 'Invalid Kilometers Reading');
  }
  if (next && log.kilometers > next.kilometers) {
    throw new AppError(`Kilometers ${log.kilometers} is greater than next recorded ${next.kilometers} at ${next.date.toISOString()}`, 422, 'https://example.com/problems/invalid-kilometers', 'Invalid Kilometers Reading');
  }

  const insertSql = `INSERT INTO vehicle_kilometers (vehicle_id, user_id, date, kilometers) VALUES ($1, $2, $3, $4) RETURNING id, vehicle_id as "vehicleId", user_id as "userId", date, kilometers, created_at as "createdAt"`;
  const inserted = await oneOrNone<VehicleKilometersLog>(insertSql, [log.vehicleId, log.userId, log.date, log.kilometers]);
  if (!inserted) {
    throw new AppError('Failed to insert kilometers log', 500);
  }
  return inserted;
};
