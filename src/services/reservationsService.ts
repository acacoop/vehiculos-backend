import { Reservation as ReservationEntity } from "@/entities/Reservation";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import type { Reservation } from "@/schemas/reservation";
import {
  validateUserExists,
  validateVehicleExists,
} from "@/utils/validation/entity";
import {
  validateDateOnlyFormat,
  validateEndDateAfterStartDate,
} from "@/utils/validation/date";
import {
  IReservationRepository,
  ReservationFilters,
} from "@/repositories/interfaces/IReservationRepository";
import { Repository } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { applyOverlapCheck } from "@/utils";

// Composite return type (was previously in ../types)
export interface ReservationWithDetails {
  id: string;
  startDate: Date;
  endDate: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    cuit: string;
    email: string;
    active: boolean;
    entraId: string;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    model: {
      id: string;
      name: string;
      brand: { id: string; name: string };
    };
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
      cuit: e.user.cuit,
      email: e.user.email,
      active: e.user.active,
      entraId: e.user.entraId,
    },
    vehicle: {
      id: e.vehicle.id,
      licensePlate: e.vehicle.licensePlate,
      model: {
        id: e.vehicle.model.id,
        name: e.vehicle.model.name,
        brand: {
          id: e.vehicle.model.brand.id,
          name: e.vehicle.model.brand.name,
        },
      },
      year: e.vehicle.year,
    },
  };
}

export class ReservationsService {
  constructor(
    private readonly repo: IReservationRepository,
    private readonly userRepo: Repository<User>,
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async getAll(
    options?: RepositoryFindOptions<ReservationFilters>,
  ): Promise<{ items: ReservationWithDetails[]; total: number }> {
    const [rows, total] = await this.repo.findAndCount(options);
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
      .where("r.user.id = :userId", { userId })
      .andWhere("r.startDate = :today", { today })
      .orderBy("r.startDate", "DESC")
      .getMany();
    return rows.map(mapEntity);
  }
  async create(
    reservation: Reservation,
  ): Promise<ReservationWithDetails | null> {
    const { userId, vehicleId, startDate, endDate } = reservation;
    await validateUserExists(userId);
    await validateVehicleExists(vehicleId);

    // Validate date format
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    validateDateOnlyFormat(startDateStr, "startDate");
    validateDateOnlyFormat(endDateStr, "endDate");
    validateEndDateAfterStartDate(startDateStr, endDateStr);

    // Check for overlapping reservations
    const overlapQuery = this.repo.qb();
    applyOverlapCheck(
      overlapQuery,
      vehicleId,
      startDateStr,
      endDateStr,
      undefined, // excludeId
      "r.vehicle.id",
      "r.startDate",
      "r.endDate",
      "r.id",
    );
    const overlap = await overlapQuery.getOne();
    if (overlap) {
      throw new Error(
        `Vehicle already has a reservation overlapping (${overlap.startDate} to ${overlap.endDate})`,
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const vehicle = await this.vehicleRepo.findOne({
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
