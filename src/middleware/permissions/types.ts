import { PermissionType } from "../../entities/authorization/PermissionType";
import { UserRoleEnum } from "../../entities/authorization/UserRoleEnum";
import { VehicleACL } from "../../entities/authorization/VehicleACL";
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
