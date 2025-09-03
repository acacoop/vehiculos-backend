import { AppDataSource } from "../db";
import { Reservation as ReservationEntity } from "../entities/Reservation";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import type { Reservation } from "../schemas/reservation";
import { validateUserExists, validateVehicleExists } from "../utils/validators";
import { ReservationRepository } from "../repositories/ReservationRepository";

// Composite return type (was previously in ../types)
export interface ReservationWithDetails {
  id: string;
  startDate: Date;
  endDate: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    dni: number;
    email: string;
    active: boolean;
    entraId: string;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
  };
}

function mapEntity(e: ReservationEntity): ReservationWithDetails {
  return {
    id: e.id,
    startDate: new Date(e.startDate),
    endDate: new Date(e.endDate),
    user: {
      id: e.user.id,
      firstName: e.user.firstName,
      lastName: e.user.lastName,
      dni: e.user.dni,
      email: e.user.email,
      active: e.user.active,
      entraId: e.user.entraId,
    },
    vehicle: {
      id: e.vehicle.id,
      licensePlate: e.vehicle.licensePlate,
      brand: e.vehicle.brand,
      model: e.vehicle.model,
      year: e.vehicle.year,
    },
  };
}

export interface GetAllReservationsOptions {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}

export class ReservationsService {
  private readonly repo: ReservationRepository;
  private readonly userRepo = () => AppDataSource.getRepository(User);
  private readonly vehicleRepo = () => AppDataSource.getRepository(Vehicle);
  constructor(repo?: ReservationRepository) {
    this.repo = repo ?? new ReservationRepository(AppDataSource);
  }

  async getAll(
    options?: GetAllReservationsOptions,
  ): Promise<{ items: ReservationWithDetails[]; total: number }> {
    const { limit, offset, searchParams } = options || {};
    const [rows, total] = await this.repo.findAndCount({
      limit,
      offset,
      searchParams,
    });
    return { items: rows.map(mapEntity), total };
  }
  async getById(id: string): Promise<ReservationWithDetails | null> {
    const r = await this.repo.findOne(id);
    return r ? mapEntity(r) : null;
  }
  async getByUserId(userId: string) {
    const rows = await this.repo.find({ user: { id: userId } });
    return rows.map(mapEntity);
  }
  async getByVehicleId(vehicleId: string) {
    const rows = await this.repo.find({ vehicle: { id: vehicleId } });
    return rows.map(mapEntity);
  }
  async getAssignedVehiclesReservations(userId: string) {
    const vehicleIds = (
      await this.repo.distinctVehicleIdsByAssignedUser(userId)
    ).map((r) => r.vehicleId);
    if (!vehicleIds.length) return [];
    const rows = await this.repo.findByVehicleIds(vehicleIds);
    return rows.map(mapEntity);
  }
  async getTodayByUserId(userId: string) {
    const today = new Date().toISOString().split("T")[0];
    const rows = await this.repo
      .qb()
      .leftJoinAndSelect("r.user", "user")
      .leftJoinAndSelect("r.vehicle", "vehicle")
      .where("r.user_id = :userId", { userId })
      .andWhere("r.start_date = :today", { today })
      .orderBy("r.start_date", "DESC")
      .getMany();
    return rows.map(mapEntity);
  }
  async create(
    reservation: Reservation,
  ): Promise<ReservationWithDetails | null> {
    const { userId, vehicleId, startDate, endDate } = reservation;
    await validateUserExists(userId);
    await validateVehicleExists(vehicleId);
    const user = await this.userRepo().findOne({ where: { id: userId } });
    const vehicle = await this.vehicleRepo().findOne({
      where: { id: vehicleId },
    });
    if (!user || !vehicle) return null;
    const entity = this.repo.create({
      user,
      vehicle,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
    const saved = await this.repo.save(entity);
    return mapEntity(saved);
  }
}

export function createReservationsService() {
  return new ReservationsService();
}
