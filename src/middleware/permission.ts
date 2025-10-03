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
import { AppDataSource } from "../db";
import { AssignmentRepository } from "../repositories/AssignmentRepository";

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
  private assignmentRepo: AssignmentRepository;

  constructor(dataSource: DataSource) {
    this.vehicleACLRepo = new VehicleACLRepository(dataSource);
    this.userGroupMembershipRepo = new UserGroupMembershipRepository(
      dataSource,
    );
    this.userGroupNestingRepo = new UserGroupNestingRepository(dataSource);
    this.vehicleResponsiblesRepo = new VehicleResponsibleRepository(dataSource);
    this.cecoRangesRepo = new CecoRangeRepository(dataSource);
    this.userRoleRepo = new UserRoleRepository(dataSource);
    this.assignmentRepo = new AssignmentRepository(dataSource);
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
    const [responsible, count] = await this.vehicleResponsiblesRepo.find({
      searchParams: {
        vehicleId,
        date: new Date().toISOString(),
      },
    });

    if (count === 0) {
      return null;
    }

    return responsible[0].ceco || null;
  }

  async checkUserIsResponsible(
    userId: string,
    vehicleId: string,
  ): Promise<boolean> {
    return this.vehicleResponsiblesRepo.isUserResponsible(userId, vehicleId);
  }

  async checkUserIsDriver(userId: string, vehicleId: string): Promise<boolean> {
    return this.assignmentRepo.hasActiveAssignment(userId, vehicleId);
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
    // First check if user is ADMIN (bypasses all checks)
    if (await this.checkUserRolePermission(userId, UserRoleEnum.ADMIN)) {
      return true;
    }

    const requiredWeight = PERMISSION_WEIGHT[requiredPermission];

    // Check if user is the vehicle responsible (grants FULL permission)
    if (await this.checkUserIsResponsible(userId, vehicleId)) {
      const responsibleWeight = PERMISSION_WEIGHT[PermissionType.FULL];
      if (responsibleWeight >= requiredWeight) {
        return true;
      }
    }

    // Check if user is assigned as driver (grants DRIVER permission)
    if (await this.checkUserIsDriver(userId, vehicleId)) {
      const driverWeight = PERMISSION_WEIGHT[PermissionType.DRIVER];
      if (driverWeight >= requiredWeight) {
        return true;
      }
    }

    // If not responsible or driver, check ACLs (groups and direct permissions)
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

// Singleton instance - created once when first needed
let permissionChecker: PermissionChecker | null = null;

const getPermissionChecker = (): PermissionChecker => {
  if (!permissionChecker) {
    if (!AppDataSource.isInitialized) {
      throw new AppError(
        "Database not initialized",
        500,
        "https://example.com/problems/internal-error",
        "Internal Server Error",
      );
    }
    permissionChecker = new PermissionChecker(AppDataSource);
  }
  return permissionChecker;
};

// Simple permission middleware that uses singleton PermissionChecker
export const requirePermission = (options: PermissionCheckOptions) => {
  return async (req: PermissionRequest, _res: Response, next: NextFunction) => {
    try {
      const checker = getPermissionChecker();
      const user = req.user;

      if (!user) {
        throw new AppError(
          "Authentication required",
          401,
          "https://example.com/problems/unauthorized",
          "Unauthorized",
        );
      }

      const hasPermission = await checker.checkUserPermission(user.id, options);

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

// Simple helper functions
export const requireRole = (role: UserRoleEnum) =>
  requirePermission({
    type: "role",
    role,
  });

export const requireVehiclePermission = (
  vehicleId: string,
  permission: PermissionType,
) =>
  requirePermission({
    type: "vehicle",
    permission,
    vehicleId,
  });

export const requireVehiclePermissionFromParam = (
  permission: PermissionType,
  paramName: string = "id",
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    const vehicleId = req.params[paramName];
    if (!vehicleId) {
      return next(
        new AppError(
          `Vehicle ID parameter '${paramName}' is required`,
          400,
          "https://example.com/problems/bad-request",
          "Bad Request",
        ),
      );
    }

    return requireVehiclePermission(vehicleId, permission)(req, res, next);
  };
};
