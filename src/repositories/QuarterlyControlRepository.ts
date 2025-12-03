import { DataSource, Repository } from "typeorm";
import { QuarterlyControl } from "@/entities/QuarterlyControl";
import {
  IQuarterlyControlRepository,
  QuarterlyControlFilters,
} from "@/repositories/interfaces/IQuarterlyControlRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class QuarterlyControlRepository implements IQuarterlyControlRepository {
  private readonly repo: Repository<QuarterlyControl>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(QuarterlyControl);
  }

  async findAndCount(
    options?: RepositoryFindOptions<QuarterlyControlFilters>,
  ): Promise<[QuarterlyControl[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.repo
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("qc.filledBy", "u")
      .leftJoinAndSelect("qc.items", "items")
      .orderBy("qc.year", "DESC")
      .addOrderBy("qc.quarter", "DESC");

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
        year: { field: "qc.year" },
        quarter: { field: "qc.quarter" },
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
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("qc.filledBy", "u")
      .leftJoinAndSelect("qc.items", "items")
      .where("qc.id = :id", { id })
      .getOne();
  }

  create(data: Partial<QuarterlyControl>) {
    return this.repo.create(data);
  }

  save(entity: QuarterlyControl) {
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected != null && result.affected > 0;
  }

  qb() {
    return this.repo.createQueryBuilder("qc");
  }
}
