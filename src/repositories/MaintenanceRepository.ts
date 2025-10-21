import { DataSource, Repository } from "typeorm";
import { Maintenance } from "@/entities/Maintenance";
import { AssignedMaintenance } from "@/entities/AssignedMaintenance";
import { IMaintenanceRepository } from "@/repositories/interfaces/IMaintenanceRepository";
import { IAssignedMaintenanceRepository } from "@/repositories/interfaces/IAssignedMaintenanceRepository";

export class MaintenanceRepository implements IMaintenanceRepository {
  private readonly repo: Repository<Maintenance>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Maintenance);
  }
  findAll() {
    return this.repo.find({ relations: ["category"], order: { name: "ASC" } });
  }
  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ["category"] });
  }
  create(data: Partial<Maintenance>) {
    return this.repo.create(data);
  }
  save(entity: Maintenance) {
    return this.repo.save(entity);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
}

export class AssignedMaintenanceRepository
  implements IAssignedMaintenanceRepository
{
  private readonly repo: Repository<AssignedMaintenance>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(AssignedMaintenance);
  }
  findByMaintenance(maintenanceId: string) {
    return this.repo.find({
      where: { maintenance: { id: maintenanceId } },
      relations: ["vehicle", "maintenance", "maintenance.category"],
    });
  }
  findByVehicle(vehicleId: string) {
    return this.repo.find({
      where: { vehicle: { id: vehicleId } },
      relations: ["maintenance", "maintenance.category", "vehicle"],
    });
  }
  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["maintenance", "vehicle", "maintenance.category"],
    });
  }
  create(data: Partial<AssignedMaintenance>) {
    return this.repo.create(data);
  }
  save(entity: AssignedMaintenance) {
    return this.repo.save(entity);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
}
