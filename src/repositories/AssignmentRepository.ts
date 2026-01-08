import { DataSource, Repository } from "typeorm";
import { Assignment } from "@/entities/Assignment";
import {
  IAssignmentRepository,
  AssignmentFilters,
} from "@/repositories/interfaces/IAssignmentRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import {
  applySearchFilter,
  applyFilters,
  applyActiveFilter,
} from "@/utils/index";

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
        ["u.firstName", "u.lastName"],
        ["u.lastName", "u.firstName"],
        "u.email",
        "v.licensePlate",
        "v.chassisNumber",
        "brand.name",
        "model.name",
        ["brand.name", "model.name"],
      ]);
    }

    // Apply filters
    applyFilters(qb, filters, {
      userId: { field: "u.id" },
      vehicleId: { field: "v.id" },
    });

    // Apply active filter
    if (filters?.active) {
      applyActiveFilter(qb, undefined, "a.startDate", "a.endDate");
    }

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
   * Find active assignments
   * Active means: startDate <= today AND (endDate IS NULL OR endDate >= today)
   */
  async findActiveAssignments(filters?: AssignmentFilters) {
    const [assignments] = await this.findAndCount({
      filters: {
        userId: filters?.userId,
        vehicleId: filters?.vehicleId,
        active: true,
      },
    });
    return assignments;
  }

  /**
   * Check if user has active assignment for vehicle
   */
  async hasActiveAssignment(
    userId: string,
    vehicleId: string,
    date?: string,
  ): Promise<boolean> {
    if (date) {
      // If a specific date is provided, check against that date
      const qb = this.repo
        .createQueryBuilder("a")
        .where("a.user.id = :userId", { userId })
        .andWhere("a.vehicle.id = :vehicleId", { vehicleId });
      applyActiveFilter(qb, date, "a.startDate", "a.endDate");
      const count = await qb.getCount();
      return count > 0;
    } else {
      // Use the standard active filter
      const assignments = await this.findActiveAssignments({
        userId,
        vehicleId,
      });
      return assignments.length > 0;
    }
  }

  qb() {
    return this.repo.createQueryBuilder("a");
  }
}
