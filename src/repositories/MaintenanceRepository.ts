import { DataSource, Repository } from "typeorm";
import { Maintenance } from "@/entities/Maintenance";
import { AssignedMaintenance } from "@/entities/AssignedMaintenance";
import {
  IMaintenanceRepository,
  MaintenanceFilters,
} from "@/repositories/interfaces/IMaintenanceRepository";
import {
  IAssignedMaintenanceRepository,
  AssignedMaintenanceFilters,
} from "@/repositories/interfaces/IAssignedMaintenanceRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class MaintenanceRepository implements IMaintenanceRepository {
  private readonly repo: Repository<Maintenance>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Maintenance);
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceFilters>,
  ): Promise<[Maintenance[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.repo
      .createQueryBuilder("m")
      .leftJoinAndSelect("m.category", "c")
      .orderBy("c.name", "ASC")
      .addOrderBy("m.name", "ASC");

    // Apply search filter across multiple fields
    if (search) {
      applySearchFilter(qb, search, ["m.name", "c.name"]);
    }

    // Apply individual filters
    applyFilters(qb, filters, {
      name: { field: "m.name", operator: "LIKE" },
      categoryId: { field: "c.id" },
    });

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
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

  async findAndCount(
    options?: RepositoryFindOptions<AssignedMaintenanceFilters>,
  ): Promise<[AssignedMaintenance[], number]> {
    const { filters, search, pagination } = options || {};
    const qb = this.repo
      .createQueryBuilder("am")
      .leftJoinAndSelect("am.vehicle", "v")
      .leftJoinAndSelect("v.model", "vm")
      .leftJoinAndSelect("vm.brand", "b")
      .leftJoinAndSelect("am.maintenance", "m")
      .leftJoinAndSelect("m.category", "c")
      .orderBy("v.licensePlate", "ASC")
      .addOrderBy("m.name", "ASC");

    // Apply search filter across multiple fields
    if (search) {
      applySearchFilter(qb, search, ["v.licensePlate", "m.name", "c.name"]);
    }

    // Apply individual filters
    applyFilters(qb, filters, {
      vehicleId: { field: "v.id" },
      maintenanceId: { field: "m.id" },
    });

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findByMaintenance(maintenanceId: string) {
    return this.repo.find({
      where: { maintenance: { id: maintenanceId } },
      relations: [
        "vehicle",
        "vehicle.model",
        "vehicle.model.brand",
        "maintenance",
        "maintenance.category",
      ],
    });
  }
  findByVehicle(vehicleId: string) {
    return this.repo.find({
      where: { vehicle: { id: vehicleId } },
      relations: [
        "vehicle",
        "vehicle.model",
        "vehicle.model.brand",
        "maintenance",
        "maintenance.category",
      ],
    });
  }
  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: [
        "vehicle",
        "vehicle.model",
        "vehicle.model.brand",
        "maintenance",
        "maintenance.category",
      ],
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
