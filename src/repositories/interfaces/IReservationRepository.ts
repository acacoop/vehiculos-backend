import { Reservation } from "@/entities/Reservation";
import { DeleteResult, SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export interface ReservationFilters {
  userId?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}

export interface IReservationRepository {
  findAndCount(
    options?: RepositoryFindOptions<ReservationFilters>,
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
