import { PermissionType } from "../../entities/PermissionType";
import { UserRoleEnum } from "../../entities/UserRoleEnum";
import { VehicleACL } from "../../entities/VehicleACL";
import { AuthenticatedRequest } from "../auth";

export interface VehiclePermissionCheckOptions {
  type: "vehicle";
  permission: PermissionType;
  vehicleId: string;
}

export interface RoleCheckOptions {
  type: "role";
  role: UserRoleEnum;
}

export type PermissionCheckOptions =
  | VehiclePermissionCheckOptions
  | RoleCheckOptions;

export interface PermissionRequest extends AuthenticatedRequest {
  permissions?: {
    vehicleACLs: VehicleACL[]; // cache for user's vehicle permissions
  };
}
