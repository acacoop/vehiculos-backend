import { oneOrNone, some } from "../db";
import { Vehicle } from "../interfaces/vehicle";

const BASE_SELECT =
  "SELECT id, license_plate as licensePlate, brand, model, year FROM vehicles";

export const getAllVehicles = async (): Promise<Vehicle[]> => {
  const sql = `${BASE_SELECT}`;
  return some<Vehicle>(sql);
};

export const getVehicleById = async (
  id: number
): Promise<Vehicle | undefined> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  const vehicle = await oneOrNone<Vehicle>(sql, [id]);
  if (!vehicle) {
    return undefined;
  }
  return vehicle;
};

export const addVehicle = async (
  vehicle: Vehicle
): Promise<Vehicle | undefined> => {
  const { licensePlate, brand, model, year } = vehicle;
  const sql = `INSERT INTO vehicles (license_plate, brand, model, year) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const params = [licensePlate, brand, model, year];
  const newVehicle = await oneOrNone<Vehicle>(sql, params);
  if (!newVehicle) {
    return undefined;
  }
  return newVehicle;
};
