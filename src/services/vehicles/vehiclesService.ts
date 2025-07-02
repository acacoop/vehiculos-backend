import { oneOrNone, some } from "../../db";
import { Vehicle } from "../../interfaces/vehicle";

export const BASE_SELECT =
  "SELECT v.id, v.license_plate as licensePlate, v.brand, v.model, v.year, v.img_url as imgUrl FROM vehicles v";

export const getAllVehicles = async (options?: { limit?: number; offset?: number }): Promise<{ items: Vehicle[]; total: number }> => {
  const { limit, offset } = options || {};
  
  // Get total count
  const countSql = "SELECT COUNT(*) as total FROM vehicles";
  const countResult = await oneOrNone<{ total: string }>(countSql);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = BASE_SELECT;
  const params: unknown[] = [];
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $1 OFFSET $2`;
    params.push(limit, offset);
  }
  
  const items = await some<Vehicle>(sql, params);
  
  return { items, total };
};

export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  return await oneOrNone<Vehicle>(sql, [id]);
};

export const getVehicleByLicensePlate = async (
  licensePlate: string,
): Promise<Vehicle | null> => {
  const sql = `${BASE_SELECT} WHERE license_plate = $1`;
  return await oneOrNone<Vehicle>(sql, [licensePlate]);
};

export const addVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
  const { licensePlate, brand, model, year, imgUrl } = vehicle;
  const sql = `INSERT INTO vehicles (license_plate, brand, model, year, img_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, license_plate as licensePlate, brand, model, year, img_url as imgUrl`;
  const params = [licensePlate, brand, model, year, imgUrl];
  return await oneOrNone<Vehicle>(sql, params);
};

export const updateVehicle = async (id: string, vehicle: Partial<Vehicle>): Promise<Vehicle | null> => {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (vehicle.licensePlate !== undefined) {
    fields.push(`license_plate = $${paramIndex++}`);
    params.push(vehicle.licensePlate);
  }
  if (vehicle.brand !== undefined) {
    fields.push(`brand = $${paramIndex++}`);
    params.push(vehicle.brand);
  }
  if (vehicle.model !== undefined) {
    fields.push(`model = $${paramIndex++}`);
    params.push(vehicle.model);
  }
  if (vehicle.year !== undefined) {
    fields.push(`year = $${paramIndex++}`);
    params.push(vehicle.year);
  }
  if (vehicle.imgUrl !== undefined) {
    fields.push(`img_url = $${paramIndex++}`);
    params.push(vehicle.imgUrl);
  }

  if (fields.length === 0) {
    return getVehicleById(id);
  }

  params.push(id);
  const sql = `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, license_plate as licensePlate, brand, model, year, img_url as imgUrl`;
  
  return await oneOrNone<Vehicle>(sql, params);
};

export const deleteVehicle = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM vehicles WHERE id = $1`;
  const result = await some(sql, [id]);
  return Array.isArray(result);
};
