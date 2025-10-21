import {
  DataSource,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  Or,
} from "typeorm";
import { Assignment } from "@/entities/Assignment";
import {
  IAssignmentRepository,
  AssignmentFilters,
} from "@/repositories/interfaces/IAssignmentRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applySearchFilter, applyFilters } from "@/utils";

export type { AssignmentFilters };

export class AssignmentRepository implements IAssignmentRepository {
  private readonly repo: Repository<Assignment>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Assignment);
  }

  async findAndCount(
    options?: RepositoryFindOptions<AssignmentFilters>,
  ): Promise<[Assignment[], number]> {
    const { filters, search, pagination } = options || {};

    const qb = this.repo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.user", "u")
      .leftJoinAndSelect("a.vehicle", "v")
      .leftJoinAndSelect("v.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .orderBy("a.startDate", "DESC");

    // Apply search filter across user and vehicle information
    if (search) {
      applySearchFilter(qb, search, [
        "u.firstName",
        "u.lastName",
        "u.email",
        "v.licensePlate",
        "v.chassisNumber",
        "brand.name",
        "model.name",
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      userId: { field: "u.id" },
      vehicleId: { field: "v.id" },
      date: { field: "a.startDate", operator: "<=" }, // Filter for assignments active on date
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
  create(data: Partial<Assignment>) {
    return this.repo.create(data);
  }
  save(entity: Assignment) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }

  count(where: Record<string, unknown>) {
    return this.repo.count({ where });
  }

  /**
   * Find active assignments for today
   * Active means: startDate <= date AND (endDate IS NULL OR endDate >= date)
   */
  async findActiveAssignments(filters?: AssignmentFilters) {
    const targetDate = filters?.date || new Date().toISOString().split("T")[0];

    const where: Record<string, unknown> = {
      startDate: LessThanOrEqual(targetDate),
      endDate: Or(IsNull(), MoreThanOrEqual(targetDate)),
    };

    if (filters?.userId) {
      where.user = { id: filters.userId };
    }
    if (filters?.vehicleId) {
      where.vehicle = { id: filters.vehicleId };
    }

    return this.repo.find({ where });
  }

  /**
   * Check if user has active assignment for vehicle today
   */
  async hasActiveAssignment(
    userId: string,
    vehicleId: string,
    date?: string,
  ): Promise<boolean> {
    const assignments = await this.findActiveAssignments({
      userId,
      vehicleId,
      date,
    });
    return assignments.length > 0;
  }
}
