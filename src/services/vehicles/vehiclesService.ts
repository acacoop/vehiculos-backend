import { AppDataSource } from "../../db";
import { Vehicle as VehicleEntity } from "../../entities/Vehicle";
import type { Vehicle } from "../../types";
import { Like } from "typeorm";
import { getCurrentResponsibleForVehicle } from "../vehicleResponsiblesService";

const repo = () => AppDataSource.getRepository(VehicleEntity);

// Kept for backward compatibility (used by other raw-SQL services). To be removed when all refactored.
export const BASE_SELECT =
  'SELECT v.id, v.license_plate as "licensePlate", v.brand, v.model, v.year, v.img_url as "imgUrl" FROM vehicles v';

export const getAllVehicles = async (options?: {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}): Promise<{ items: Vehicle[]; total: number }> => {
  const { searchParams } = options || {};
  const where: Partial<Record<string, unknown>> = {};
  if (searchParams) {
    if (searchParams.licensePlate)
      where.licensePlate = searchParams.licensePlate;
    if (searchParams.brand) where.brand = Like(`%${searchParams.brand}%`);
    if (searchParams.model) where.model = Like(`%${searchParams.model}%`);
    if (searchParams.year) where.year = Number(searchParams.year);
  }
  const [entities, total] = await repo().findAndCount({
    where,
    take: options?.limit,
    skip: options?.offset,
    order: { brand: "ASC", model: "ASC" },
  });
  const items: Vehicle[] = entities.map(mapEntity);
  return { items, total };
};

export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  const entity = await repo().findOne({ where: { id } });
  if (!entity) return null;
  const currentResponsible = await getCurrentResponsibleForVehicle(id);
  return { ...mapEntity(entity), currentResponsible };
};

export const addVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
  const created = repo().create({
    licensePlate: vehicle.licensePlate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    imgUrl: vehicle.imgUrl ?? null,
  });
  const saved = await repo().save(created);
  return mapEntity(saved);
};

export const updateVehicle = async (
  id: string,
  vehicle: Partial<Vehicle>,
): Promise<Vehicle | null> => {
  const existing = await repo().findOne({ where: { id } });
  if (!existing) return null;
  Object.assign(existing, {
    licensePlate: vehicle.licensePlate ?? existing.licensePlate,
    brand: vehicle.brand ?? existing.brand,
    model: vehicle.model ?? existing.model,
    year: vehicle.year ?? existing.year,
    imgUrl: vehicle.imgUrl !== undefined ? vehicle.imgUrl : existing.imgUrl,
  });
  const saved = await repo().save(existing);
  return mapEntity(saved);
};

export const deleteVehicle = async (id: string): Promise<boolean> => {
  const res = await repo().delete(id);
  return res.affected === 1;
};

function mapEntity(e: VehicleEntity): Vehicle {
  return {
    id: e.id,
    licensePlate: e.licensePlate,
    brand: e.brand,
    model: e.model,
    year: e.year,
    imgUrl: e.imgUrl ?? undefined,
  };
}
