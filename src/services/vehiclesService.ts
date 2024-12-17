import { oneOrNone, some } from "../db";
import { Vehicle } from "../interfaces/vehicle";

export const BASE_SELECT =
  "SELECT v.id, v.license_plate as licensePlate, v.brand, v.model, v.year, v.img_url as imgUrl FROM vehicles v";

export const getAllVehicles = async (): Promise<Vehicle[]> => {
  const sql = `${BASE_SELECT}`;
  return some<Vehicle>(sql);
};

export const getVehicleById = async (id: number): Promise<Vehicle | null> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  return await oneOrNone<Vehicle>(sql, [id]);
};

export const getVehicleByLicensePlate = async (
  licensePlate: string
): Promise<Vehicle | null> => {
  const sql = `${BASE_SELECT} WHERE license_plate = $1`;
  return await oneOrNone<Vehicle>(sql, [licensePlate]);
};

export const addVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
  const { licensePlate, brand, model, year } = vehicle;
  const sql = `INSERT INTO vehicles (license_plate, brand, model, year) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const params = [licensePlate, brand, model, year];
  return await oneOrNone<Vehicle>(sql, params);
};
