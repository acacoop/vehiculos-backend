import { DataSource, Repository } from "typeorm";
import { MaintenanceRecord } from "@/entities/MaintenanceRecord";
import {
  IMaintenanceRecordRepository,
  MaintenanceRecordFilters,
} from "@/repositories/interfaces/IMaintenanceRecordRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export type { MaintenanceRecordFilters };

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

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceRecordFilters>,
  ): Promise<[MaintenanceRecord[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.qb()
      .leftJoinAndSelect("mr.assignedMaintenance", "am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("am.maintenance", "m")
      .leftJoinAndSelect("mr.user", "u")
      .orderBy("mr.date", "DESC");

    // Apply search filter across maintenance details, user, and vehicle
    if (search) {
      applySearchFilter(qb, search, [
        "m.name",
        "mr.notes",
        "u.firstName",
        "u.lastName",
        "u.email",
        "v.licensePlate",
        "brand.name",
        "model.name",
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      userId: { field: "u.id" },
      vehicleId: { field: "v.id" },
      maintenanceId: { field: "m.id" },
      assignedMaintenanceId: { field: "am.id" },
    });

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  findByVehicle(vehicleId: string) {
    return this.qb()
      .leftJoinAndSelect("mr.assignedMaintenance", "am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
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
