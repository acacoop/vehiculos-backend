import { Reservation } from "../../entities/Reservation";
import { DeleteResult, SelectQueryBuilder } from "typeorm";

export interface ReservationSearchParams {
  userId?: string;
  vehicleId?: string;
}

export interface ReservationFindOptions {
  limit?: number;
  offset?: number;
  searchParams?: ReservationSearchParams;
}

export interface IReservationRepository {
  findAndCount(
    options?: ReservationFindOptions,
  ): Promise<[Reservation[], number]>;
  find(where: Record<string, unknown>): Promise<Reservation[]>;
  findOne(id: string): Promise<Reservation | null>;
  create(data: Partial<Reservation>): Reservation;
  save(entity: Reservation): Promise<Reservation>;
  delete(id: string): Promise<DeleteResult>;
  distinctVehicleIdsByAssignedUser(
    userId: string,
  ): Promise<Array<{ vehicleId: string }>>;
  findByVehicleIds(vehicleIds: string[]): Promise<Reservation[]>;
  qb(): SelectQueryBuilder<Reservation>;
}
