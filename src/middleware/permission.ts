import { Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import { AuthenticatedRequest } from "./auth";
import {
  PermissionType,
  PERMISSION_WEIGHT,
} from "../entities/authorization/PermissionType";
import { ACLType, VehicleACL } from "../entities/authorization/VehicleACL";
import { DataSource } from "typeorm";
import { VehicleACLRepository } from "../repositories/VehicleACLRepository";
import { UserGroupMembershipRepository } from "../repositories/UserGroupMembershipRepository";
import { UserGroupNestingRepository } from "../repositories/UserGroupNestingRepository";
import { VehicleSelection } from "../entities/authorization/VehicleSelection";
import { VehicleResponsibleRepository } from "../repositories/VehicleResponsibleRepository";
import { CecoRangeRepository } from "../repositories/CecoRangeRepository";
import { UserRoleRepository } from "../repositories/UserRoleRepository";
import { UserRoleEnum } from "../entities/authorization/UserRole";

interface VehiclePermissionCheckOptions {
  type: "vehicle";
  permission: PermissionType;
  vehicleId: string;
}

interface RoleCheckOptions {
  type: "role";
  role: UserRoleEnum;
}

type PermissionCheckOptions = VehiclePermissionCheckOptions | RoleCheckOptions;

export interface PermissionRequest extends AuthenticatedRequest {
  permissions?: {
    vehicleACLs: VehicleACL[]; // cache for user's vehicle permissions
  };
}

// Permission checking service (could be moved to a separate service file)
class PermissionChecker {
  private vehicleACLRepo: VehicleACLRepository;
  private userGroupMembershipRepo: UserGroupMembershipRepository;
  private userGroupNestingRepo: UserGroupNestingRepository;
  private vehicleResponsiblesRepo: VehicleResponsibleRepository;
  private cecoRangesRepo: CecoRangeRepository;
  private userRoleRepo: UserRoleRepository;

  constructor(dataSource: DataSource) {
    this.vehicleACLRepo = new VehicleACLRepository(dataSource);
    this.userGroupMembershipRepo = new UserGroupMembershipRepository(
      dataSource,
    );
    this.userGroupNestingRepo = new UserGroupNestingRepository(dataSource);
    this.vehicleResponsiblesRepo = new VehicleResponsibleRepository(dataSource);
    this.cecoRangesRepo = new CecoRangeRepository(dataSource);
    this.userRoleRepo = new UserRoleRepository(dataSource);
  }

  async getParentsGroupIds(groupId: string): Promise<Set<string>> {
    const groupIds = new Set<string>(groupId);

    const nestedGroup = await this.userGroupNestingRepo.findOne(groupId);

    if (!nestedGroup) {
      return groupIds;
    }

    const parentGroupIds = await this.getParentsGroupIds(
      nestedGroup.parentGroup.id,
    );
    parentGroupIds.forEach((id) => groupIds.add(id));

    return groupIds;
  }

  async checkVehicleInSelection(
    vehicleId: string,
    ceco: string | null,
    selection: VehicleSelection,
  ): Promise<boolean> {
    if (selection.vehicles.some((v) => v.id === vehicleId)) {
      return true;
    }

    if (!ceco) return false;

    const [cecoRanges, _] = await this.cecoRangesRepo.findAndCount({
      searchParams: { vehicleSelectionId: selection.id },
    });

    for (const range of cecoRanges) {
      const start = Number(range.startCeco);
      const end = Number(range.endCeco);
      const cecoNum = Number(ceco);
      if (cecoNum >= start && cecoNum <= end) {
        return true;
      }
    }

    return false;
  }

  async getVehicleCeco(vehicleId: string): Promise<string | null> {
    const responsible = await this.vehicleResponsiblesRepo.find({
      searchParams: {
        vehicleId,
        date: new Date().toISOString(),
      },
    });

    if (responsible[1] === 0) {
      return null;
    }

    return responsible[0][0].ceco || null;
  }

  async checkACLPermission(
    acl: VehicleACL,
    vehicleId: string,
    vehicleCeco: string | null,
    requeredWeight: number,
  ): Promise<boolean> {
    if (PERMISSION_WEIGHT[acl.permission] < requeredWeight) {
      return false;
    }

    return this.checkVehicleInSelection(
      vehicleId,
      vehicleCeco,
      acl.vehicleSelection,
    );
  }

  async checkUserVehiclePermission(
    userId: string,
    vehicleId: string,
    requiredPermission: PermissionType,
  ): Promise<boolean> {
    if (await this.checkUserRolePermission(userId, UserRoleEnum.ADMIN)) {
      return true;
    }

    const requiredWeight = PERMISSION_WEIGHT[requiredPermission];
    const vehicleCeco = await this.getVehicleCeco(vehicleId);

    // Get the ACLs directly assigned to the user
    const [userACLs, __] = await this.vehicleACLRepo.findAndCount({
      searchParams: {
        aclType: ACLType.USER,
        entityId: userId,
      },
    });

    // Get user's groups
    const userGroups = await this.userGroupMembershipRepo.findAndCount({
      searchParams: { userId },
    });
    const groupIds = userGroups[0].map((ugm) => ugm.userGroup.id);
    const allGroupIds = new Set<string>(groupIds);

    for (const groupId of groupIds) {
      const parentGroupIds = await this.getParentsGroupIds(groupId);
      parentGroupIds.forEach((id) => allGroupIds.add(id));
    }

    if (allGroupIds.size === 0) return false;

    const groupACLs = [];

    for (const groupId of allGroupIds) {
      const [groupACL, _] = await this.vehicleACLRepo.findAndCount({
        searchParams: {
          aclType: ACLType.USER_GROUP,
          entityId: groupId,
        },
      });
      groupACLs.push(...groupACL);
    }

    const allACLs = [...userACLs, ...groupACLs];

    return allACLs.some((acl) =>
      this.checkACLPermission(acl, vehicleId, vehicleCeco, requiredWeight),
    );
  }

  async checkUserRolePermission(
    userId: string,
    role: UserRoleEnum,
  ): Promise<boolean> {
    const [userRoles, _] = await this.userRoleRepo.findAndCount({
      searchParams: { userId, role: role as UserRoleEnum },
    });
    return userRoles.length > 0;
  }

  async checkUserPermission(
    userId: string,
    options: PermissionCheckOptions,
  ): Promise<boolean> {
    switch (options.type) {
      case "vehicle":
        return this.checkUserVehiclePermission(
          userId,
          options.vehicleId,
          options.permission,
        );
      case "role":
        return this.checkUserRolePermission(userId, options.role);
      default:
        return false;
    }
  }
}

// Global permission checker instance (in real app, inject via DI)
let permissionChecker: PermissionChecker | null = null;

export const initializePermissionChecker = (dataSource: DataSource) => {
  permissionChecker = new PermissionChecker(dataSource);
};

// Middleware factory for permission checks
export const requirePermission = (options: PermissionCheckOptions) => {
  return async (req: PermissionRequest, _res: Response, next: NextFunction) => {
    try {
      if (!permissionChecker) {
        throw new AppError(
          "Permission checker not initialized",
          500,
          "https://example.com/problems/internal-error",
          "Internal Server Error",
        );
      }

      const user = req.user;
      if (!user) {
        throw new AppError(
          "Authentication required",
          401,
          "https://example.com/problems/unauthorized",
          "Unauthorized",
        );
      }

      const hasPermission = await permissionChecker.checkUserPermission(
        user.id,
        options,
      );

      if (!hasPermission) {
        throw new AppError(
          "Insufficient permissions",
          403,
          "https://example.com/problems/forbidden",
          "Forbidden",
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

// Convenience middleware for common permissions
export const requireVehiclePermission = (
  vehicleId: string,
  permission: PermissionType,
) =>
  requirePermission({
    type: "vehicle",
    permission,
    vehicleId,
  });

export const requireRole = (role: UserRoleEnum) =>
  requirePermission({
    type: "role",
    role,
  });
