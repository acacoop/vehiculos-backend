import { VehicleACLRepository } from "../repositories/VehicleACLRepository";
import { VehicleACL } from "../entities/VehicleACL";
import {
  VehicleACLCreateInput,
  VehicleACLUpdateInput,
} from "../schemas/vehicleAcl";
import { AppError } from "../middleware/errorHandler";
import { RepositoryFindOptions } from "../repositories/interfaces/common";
import { VehicleACLSearchParams } from "../repositories/VehicleACLRepository";

export class VehicleACLService {
  constructor(private readonly repository: VehicleACLRepository) {}

  async getAll(
    options?: RepositoryFindOptions<VehicleACLSearchParams>,
  ): Promise<{ items: VehicleACL[]; total: number }> {
    const [items, total] = await this.repository.findAndCount({
      ...options?.pagination,
      searchParams: options?.searchParams,
    });
    return { items, total };
  }

  async getById(id: string): Promise<VehicleACL | null> {
    return this.repository.findOne(id);
  }

  async create(data: VehicleACLCreateInput): Promise<VehicleACL> {
    // Validate time period
    if (data.endTime && data.startTime >= data.endTime) {
      throw new AppError(
        "End time must be after start time",
        400,
        "https://example.com/problems/validation-error",
        "Validation Error",
      );
    }

    const acl = this.repository.create(data);
    return this.repository.save(acl);
  }

  async update(
    id: string,
    data: VehicleACLUpdateInput,
  ): Promise<VehicleACL | null> {
    const existing = await this.repository.findOne(id);
    if (!existing) return null;

    // Validate time period if both are being updated
    const newStartTime = data.startTime || existing.startTime;
    const newEndTime =
      data.endTime !== undefined ? data.endTime : existing.endTime;

    if (newEndTime && newStartTime >= newEndTime) {
      throw new AppError(
        "End time must be after start time",
        400,
        "https://example.com/problems/validation-error",
        "Validation Error",
      );
    }

    if (data.permission !== undefined) existing.permission = data.permission;
    if (data.startTime !== undefined) existing.startTime = data.startTime;
    if (data.endTime !== undefined) existing.endTime = data.endTime;

    return this.repository.save(existing);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }

  async getActiveACLsForUser(userId: string, at?: Date): Promise<VehicleACL[]> {
    return this.repository.getActiveACLsForUser(userId, at);
  }
}
