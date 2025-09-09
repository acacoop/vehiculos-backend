import { DataSource, Repository } from "typeorm";
import { Assignment } from "../entities/Assignment";

export interface AssignmentSearchParams {
  userId?: string;
  vehicleId?: string;
}

export class AssignmentRepository {
  private readonly repo: Repository<Assignment>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Assignment);
  }
  findAndCount(opts?: {
    limit?: number;
    offset?: number;
    searchParams?: AssignmentSearchParams;
  }) {
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
  count(where: Record<string, unknown>) {
    return this.repo.count({ where });
  }
}
