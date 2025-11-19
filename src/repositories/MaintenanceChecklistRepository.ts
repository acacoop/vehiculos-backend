import { DataSource, Repository } from "typeorm";
import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";
import {
  IMaintenanceChecklistRepository,
  MaintenanceChecklistFilters,
} from "@/repositories/interfaces/IMaintenanceChecklistRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class MaintenanceChecklistRepository
  implements IMaintenanceChecklistRepository
{
  private readonly repo: Repository<MaintenanceChecklist>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceChecklist);
  }

  async findAndCount(
    options?: RepositoryFindOptions<MaintenanceChecklistFilters>,
  ): Promise<[MaintenanceChecklist[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.repo
      .createQueryBuilder("mc")
      .leftJoinAndSelect("mc.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mc.filledBy", "u")
      .orderBy("mc.year", "DESC")
      .addOrderBy("mc.quarter", "DESC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, [
        "v.licensePlate",
        "brand.name",
        "model.name",
        "u.firstName",
        "u.lastName",
        "u.email",
      ]);
    }

    // Apply filters
    if (filters) {
      applyFilters(qb, filters, {
        vehicleId: { field: "v.id" },
        year: { field: "mc.year" },
        quarter: { field: "mc.quarter" },
        filledBy: { field: "u.id" },
      });
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return await qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo
      .createQueryBuilder("mc")
      .leftJoinAndSelect("mc.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("mc.filledBy", "u")
      .where("mc.id = :id", { id })
      .getOne();
  }

  create(data: Partial<MaintenanceChecklist>) {
    return this.repo.create(data);
  }

  save(entity: MaintenanceChecklist) {
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected != null && result.affected > 0;
  }

  qb() {
    return this.repo.createQueryBuilder("mc");
  }
}
