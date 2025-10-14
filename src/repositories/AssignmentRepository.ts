import {
  DataSource,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  Or,
} from "typeorm";
import { Assignment } from "../entities/Assignment";
import {
  IAssignmentRepository,
  AssignmentSearchParams,
  AssignmentFindOptions,
} from "./interfaces/IAssignmentRepository";

export type { AssignmentSearchParams, AssignmentFindOptions };

export class AssignmentRepository implements IAssignmentRepository {
  private readonly repo: Repository<Assignment>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Assignment);
  }
  findAndCount(opts?: AssignmentFindOptions) {
    const { searchParams } = opts || {};
    const where: Record<string, unknown> = {};
    if (searchParams?.userId) where.user = { id: searchParams.userId };
    if (searchParams?.vehicleId) where.vehicle = { id: searchParams.vehicleId };
    return this.repo.findAndCount({
      where,
      take: opts?.limit,
      skip: opts?.offset,
      order: { startDate: "DESC" },
    });
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
  async findActiveAssignments(searchParams?: AssignmentSearchParams) {
    const targetDate =
      searchParams?.date || new Date().toISOString().split("T")[0];

    const where: Record<string, unknown> = {
      startDate: LessThanOrEqual(targetDate),
      endDate: Or(IsNull(), MoreThanOrEqual(targetDate)),
    };

    if (searchParams?.userId) {
      where.user = { id: searchParams.userId };
    }
    if (searchParams?.vehicleId) {
      where.vehicle = { id: searchParams.vehicleId };
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
