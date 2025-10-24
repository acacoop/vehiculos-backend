import { VehicleResponsible } from "@/entities/VehicleResponsible";
import { DeleteResult, SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export interface VehicleResponsibleFilters {
  vehicleId?: string;
  userId?: string;
  active?: boolean; // true = apply active filter, false/undefined = don't apply
}

/**
 * Interface for VehicleResponsible Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IVehicleResponsibleRepository {
  qb(): SelectQueryBuilder<VehicleResponsible>;
  findOne(id: string): Promise<VehicleResponsible | null>;
  findDetailedById(id: string): Promise<VehicleResponsible | null>;
  save(ent: VehicleResponsible): Promise<VehicleResponsible>;
  delete(id: string): Promise<DeleteResult>;
  create(data: Partial<VehicleResponsible>): VehicleResponsible;
  find(
    options?: RepositoryFindOptions<VehicleResponsibleFilters>,
  ): Promise<[VehicleResponsible[], number]>;
  findCurrentByVehicle(vehicleId: string): Promise<VehicleResponsible | null>;
  findCurrentForUser(userId: string): Promise<VehicleResponsible[]>;
  findVehiclesForUserOnDate(
    userId: string,
    date: string,
  ): Promise<VehicleResponsible[]>;
  findActiveResponsibles(
    filters?: VehicleResponsibleFilters,
  ): Promise<VehicleResponsible[]>;
  isUserResponsible(
    userId: string,
    vehicleId: string,
    date?: string,
  ): Promise<boolean>;
}
