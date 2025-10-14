import { AssignedMaintenance } from "../../entities/AssignedMaintenance";
import { DeleteResult } from "typeorm";

export interface IAssignedMaintenanceRepository {
  findByMaintenance(maintenanceId: string): Promise<AssignedMaintenance[]>;
  findByVehicle(vehicleId: string): Promise<AssignedMaintenance[]>;
  findOne(id: string): Promise<AssignedMaintenance | null>;
  create(data: Partial<AssignedMaintenance>): AssignedMaintenance;
  save(entity: AssignedMaintenance): Promise<AssignedMaintenance>;
  delete(id: string): Promise<DeleteResult>;
}
