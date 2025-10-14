import { DataSource, Repository } from "typeorm";
import { MaintenanceRecord } from "../entities/MaintenanceRecord";
import { IMaintenanceRecordRepository } from "./interfaces/IMaintenanceRecordRepository";

export interface MaintenanceRecordSearchParams {
  userId?: string;
  vehicleId?: string;
  maintenanceId?: string;
  assignedMaintenanceId?: string;
}

export class MaintenanceRecordRepository
  implements IMaintenanceRecordRepository
{
  private readonly repo: Repository<MaintenanceRecord>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceRecord);
  }
  qb() {
    return this.repo.createQueryBuilder("mr");
  }
  findAndCount(opts?: {
    limit?: number;
    offset?: number;
    filters?: MaintenanceRecordSearchParams;
  }) {
    const { filters } = opts || {};
    const qb = this.qb()
      .leftJoinAndSelect("mr.assignedMaintenance", "am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("am.maintenance", "m")
      .leftJoinAndSelect("mr.user", "u");

    if (filters?.userId)
      qb.andWhere("u.id = :userId", { userId: filters.userId });
    if (filters?.vehicleId)
      qb.andWhere("v.id = :vehicleId", { vehicleId: filters.vehicleId });
    if (filters?.maintenanceId)
      qb.andWhere("m.id = :maintenanceId", {
        maintenanceId: filters.maintenanceId,
      });
    if (filters?.assignedMaintenanceId)
      qb.andWhere("am.id = :assignedMaintenanceId", {
        assignedMaintenanceId: filters.assignedMaintenanceId,
      });

    return qb
      .orderBy("mr.date", "DESC")
      .skip(opts?.offset)
      .take(opts?.limit)
      .getManyAndCount();
  }
  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  findByVehicle(vehicleId: string) {
    return this.qb()
      .leftJoinAndSelect("mr.assignedMaintenance", "am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("am.maintenance", "m")
      .leftJoinAndSelect("mr.user", "u")
      .where("v.id = :vehicleId", { vehicleId })
      .orderBy("mr.date", "DESC")
      .getMany();
  }
  create(data: Partial<MaintenanceRecord>) {
    return this.repo.create(data);
  }
  save(entity: MaintenanceRecord) {
    return this.repo.save(entity);
  }
  findByAssignedMaintenance(assignedMaintenanceId: string) {
    return this.repo.find({
      where: { assignedMaintenance: { id: assignedMaintenanceId } },
      order: { date: "DESC" },
    });
  }
}
