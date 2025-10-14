import { Maintenance } from "../../entities/Maintenance";
import { DeleteResult } from "typeorm";

export interface IMaintenanceRepository {
  findAll(): Promise<Maintenance[]>;
  findOne(id: string): Promise<Maintenance | null>;
  create(data: Partial<Maintenance>): Maintenance;
  save(entity: Maintenance): Promise<Maintenance>;
  delete(id: string): Promise<DeleteResult>;
}
