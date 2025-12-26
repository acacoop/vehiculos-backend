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

export class MaintenanceRecordRepository implements IMaintenanceRecordRepository {
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
      .leftJoinAndSelect("mr.maintenance", "m")
      .leftJoinAndSelect("m.category", "mc")
      .leftJoinAndSelect("mr.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mr.user", "u")
      .leftJoinAndSelect("mr.kilometersLog", "kl")
      .leftJoinAndSelect("kl.user", "klu")
      .leftJoinAndSelect("kl.vehicle", "klv")
      .orderBy("mr.date", "DESC");

    // Apply search filter across maintenance details, user, and vehicle
    if (search) {
      applySearchFilter(qb, search, [
        "m.name",
        "mr.notes",
        "u.firstName",
        "u.lastName",
        ["u.firstName", "u.lastName"],
        ["u.lastName", "u.firstName"],
        "u.email",
        "v.licensePlate",
        "brand.name",
        "model.name",
        ["brand.name", "model.name"],
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      userId: { field: "u.id" },
      vehicleId: { field: "v.id" },
      maintenanceId: { field: "m.id" },
    });

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.qb()
      .leftJoinAndSelect("mr.maintenance", "m")
      .leftJoinAndSelect("m.category", "mc")
      .leftJoinAndSelect("mr.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mr.user", "u")
      .leftJoinAndSelect("mr.kilometersLog", "kl")
      .leftJoinAndSelect("kl.user", "klu")
      .leftJoinAndSelect("kl.vehicle", "klv")
      .where("mr.id = :id", { id })
      .getOne();
  }

  findByVehicle(vehicleId: string) {
    return this.qb()
      .leftJoinAndSelect("mr.maintenance", "m")
      .leftJoinAndSelect("m.category", "mc")
      .leftJoinAndSelect("mr.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mr.user", "u")
      .leftJoinAndSelect("mr.kilometersLog", "kl")
      .leftJoinAndSelect("kl.user", "klu")
      .leftJoinAndSelect("kl.vehicle", "klv")
      .where("v.id = :vehicleId", { vehicleId })
      .orderBy("mr.date", "DESC")
      .getMany();
  }

  findByMaintenance(maintenanceId: string) {
    return this.qb()
      .leftJoinAndSelect("mr.maintenance", "m")
      .leftJoinAndSelect("m.category", "mc")
      .leftJoinAndSelect("mr.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mr.user", "u")
      .leftJoinAndSelect("mr.kilometersLog", "kl")
      .leftJoinAndSelect("kl.user", "klu")
      .leftJoinAndSelect("kl.vehicle", "klv")
      .where("m.id = :maintenanceId", { maintenanceId })
      .orderBy("mr.date", "DESC")
      .getMany();
  }

  create(data: Partial<MaintenanceRecord>) {
    return this.repo.create(data);
  }

  save(entity: MaintenanceRecord) {
    return this.repo.save(entity);
  }
}
