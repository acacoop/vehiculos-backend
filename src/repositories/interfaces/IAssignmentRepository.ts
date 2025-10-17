import { Assignment } from "../../entities/Assignment";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "./common";

export interface AssignmentFilters {
  userId?: string;
  vehicleId?: string;
  date?: string;
}

export interface IAssignmentRepository {
  findAndCount(
    options?: RepositoryFindOptions<AssignmentFilters>,
  ): Promise<[Assignment[], number]>;
  findOne(id: string): Promise<Assignment | null>;
  create(data: Partial<Assignment>): Assignment;
  save(entity: Assignment): Promise<Assignment>;
  delete(id: string): Promise<DeleteResult>;
  count(where: Record<string, unknown>): Promise<number>;
  findActiveAssignments(filters?: AssignmentFilters): Promise<Assignment[]>;
  hasActiveAssignment(
    userId: string,
    vehicleId: string,
    date?: string,
  ): Promise<boolean>;
}
