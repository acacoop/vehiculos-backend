import { DataSource, Repository } from "typeorm";
import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import {
  IQuarterlyControlItemRepository,
  QuarterlyControlItemFilters,
} from "@/repositories/interfaces/IQuarterlyControlItemRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils/index";

export class QuarterlyControlItemRepository
  implements IQuarterlyControlItemRepository
{
  private readonly repo: Repository<QuarterlyControlItem>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(QuarterlyControlItem);
  }

  async findAndCount(
    options?: RepositoryFindOptions<QuarterlyControlItemFilters>,
  ): Promise<[QuarterlyControlItem[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.repo
      .createQueryBuilder("qci")
      .leftJoinAndSelect("qci.quarterlyControl", "qc")
      .leftJoinAndSelect("qc.vehicle", "v")
      .leftJoinAndSelect("qc.filledBy", "u")
      .orderBy("qci.id", "ASC");

    // Apply search filter
    if (search) {
      applySearchFilter(qb, search, [
        "qci.observations",
        "v.licensePlate",
        "u.firstName",
        "u.lastName",
      ]);
    }

    // Apply filters
    if (filters) {
      applyFilters(qb, filters, {
        quarterlyControlId: { field: "qc.id" },
        status: { field: "qci.status" },
      });
    }

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  findOne(id: string) {
    return this.repo
      .createQueryBuilder("qci")
      .leftJoinAndSelect("qci.quarterlyControl", "qc")
      .leftJoinAndSelect("qc.vehicle", "v")
      .leftJoinAndSelect("qc.filledBy", "u")
      .where("qci.id = :id", { id })
      .getOne();
  }

  create(data: Partial<QuarterlyControlItem>) {
    return this.repo.create(data);
  }

  createMany(data: Partial<QuarterlyControlItem>[]) {
    return this.repo.create(data);
  }

  save(entity: QuarterlyControlItem) {
    return this.repo.save(entity);
  }

  saveMany(entities: QuarterlyControlItem[]) {
    return this.repo.save(entities);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected != null && result.affected > 0;
  }

  qb() {
    return this.repo.createQueryBuilder("qci");
  }
}
