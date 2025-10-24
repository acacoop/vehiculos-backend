import { VehicleACL } from "@/entities/VehicleACL";
import { PermissionType } from "@/enums/PermissionType";

export interface VehicleACLFilters {
  userId?: string;
  vehicleId?: string;
  permission?: PermissionType;
  active?: boolean;
}

/**
 * Interface for VehicleACL Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IVehicleACLRepository {
  findAndCount(options?: {
    limit?: number;
    offset?: number;
    filters?: VehicleACLFilters;
    search?: string;
  }): Promise<[VehicleACL[], number]>;
  findOne(id: string): Promise<VehicleACL | null>;
  getActiveACLsForUser(userId: string, at?: Date): Promise<VehicleACL[]>;
  hasPermission(
    userId: string,
    vehicleId: string,
    requiredPermission: PermissionType,
    at?: Date,
  ): Promise<boolean>;
  create(data: Partial<VehicleACL>): VehicleACL;
  save(entity: VehicleACL): Promise<VehicleACL>;
  delete(id: string): Promise<{ affected?: number }>;
}
