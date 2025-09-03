import { DataSource, Repository } from "typeorm";
import { MaintenanceRecord } from "../entities/MaintenanceRecord";

export interface MaintenanceRecordSearchParams {
  userId?: string;
  vehicleId?: string;
}

export class MaintenanceRecordRepository {
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
    searchParams?: MaintenanceRecordSearchParams;
  }) {
    const { searchParams } = opts || {};
    const qb = this.qb()
      .leftJoinAndSelect("mr.assignedMaintenance", "am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("mr.user", "u");
    if (searchParams?.userId)
      qb.andWhere("u.id = :userId", { userId: searchParams.userId });
    if (searchParams?.vehicleId)
      qb.andWhere("v.id = :vehicleId", { vehicleId: searchParams.vehicleId });
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
