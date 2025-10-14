import { Assignment } from "../../entities/Assignment";
import { DeleteResult } from "typeorm";

export interface AssignmentSearchParams {
  userId?: string;
  vehicleId?: string;
  date?: string;
}

export interface AssignmentFindOptions {
  limit?: number;
  offset?: number;
  searchParams?: AssignmentSearchParams;
}

export interface IAssignmentRepository {
  findAndCount(
    options?: AssignmentFindOptions,
  ): Promise<[Assignment[], number]>;
  findOne(id: string): Promise<Assignment | null>;
  create(data: Partial<Assignment>): Assignment;
  save(entity: Assignment): Promise<Assignment>;
  delete(id: string): Promise<DeleteResult>;
  count(where: Record<string, unknown>): Promise<number>;
  findActiveAssignments(
    searchParams?: AssignmentSearchParams,
  ): Promise<Assignment[]>;
  hasActiveAssignment(
    userId: string,
    vehicleId: string,
    date?: string,
  ): Promise<boolean>;
}
