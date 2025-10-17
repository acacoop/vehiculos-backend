import { Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import { AuthenticatedRequest } from "./auth";
import { PermissionType, PERMISSION_WEIGHT } from "../utils";
import { VehicleACL } from "../entities/VehicleACL";
import { DataSource } from "typeorm";
import { VehicleACLRepository } from "../repositories/VehicleACLRepository";
import { VehicleResponsibleRepository } from "../repositories/VehicleResponsibleRepository";
import { UserRoleRepository } from "../repositories/UserRoleRepository";
import { UserRoleEnum } from "../utils";
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

/**
 * Simplified Permission Checker
 *
 * Permission hierarchy (from lowest to highest):
 * 1. Direct ACLs (explicit user-vehicle permissions with time periods)
 * 2. Assignments (current drivers get DRIVER permission)
 * 3. Responsibles (current responsibles get FULL permission)
 * 4. Admin role (bypasses all checks)
 */
export class PermissionChecker {
  private vehicleACLRepo: VehicleACLRepository;
  private vehicleResponsiblesRepo: VehicleResponsibleRepository;
  private userRoleRepo: UserRoleRepository;
  private assignmentRepo: AssignmentRepository;

  constructor(dataSource: DataSource) {
    this.vehicleACLRepo = new VehicleACLRepository(dataSource);
    this.vehicleResponsiblesRepo = new VehicleResponsibleRepository(dataSource);
    this.userRoleRepo = new UserRoleRepository(dataSource);
    this.assignmentRepo = new AssignmentRepository(dataSource);
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

    // Check direct ACLs (simple user-vehicle-permission mappings with time periods)
    const hasACLPermission = await this.vehicleACLRepo.hasPermission(
      userId,
      vehicleId,
      requiredPermission,
    );

    return hasACLPermission;
  }

  async checkUserRolePermission(
    userId: string,
    role: UserRoleEnum,
  ): Promise<boolean> {
    const [userRoles, _] = await this.userRoleRepo.findAndCount({
      filters: { userId, role: role as UserRoleEnum },
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

/**
 * Requires user to be viewing their own data OR be an admin.
 * Useful for endpoints like /user/:userId/something
 */
export const requireSelfOrAdmin = (userIdParam: string = "userId") => {
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

      const targetUserId = req.params[userIdParam];
      if (!targetUserId) {
        return next(
          new AppError(
            `User ID parameter '${userIdParam}' is required`,
            400,
            "https://example.com/problems/bad-request",
            "Bad Request",
          ),
        );
      }

      // Check if user is admin OR accessing their own data
      const isAdmin = await checker.checkUserRolePermission(
        user.id,
        UserRoleEnum.ADMIN,
      );
      const isSelf = user.id === targetUserId;

      if (!isAdmin && !isSelf) {
        throw new AppError(
          "You can only access your own data",
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

export const requireVehiclePermissionFromBody = (
  permission: PermissionType,
  bodyField: string = "vehicleId",
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    const vehicleId = req.body?.[bodyField];
    if (!vehicleId) {
      return next(
        new AppError(
          `Vehicle ID field '${bodyField}' is required in request body`,
          400,
          "https://example.com/problems/bad-request",
          "Bad Request",
        ),
      );
    }

    return requireVehiclePermission(vehicleId, permission)(req, res, next);
  };
};

/**
 * Generic middleware that extracts vehicleId using a custom mapper function.
 * The mapper receives the request and should return the vehicleId or null/undefined.
 *
 * @param permission - The required permission level
 * @param vehicleIdMapper - Function that extracts vehicleId from the request
 *
 * @example
 * // Extract from body
 * requireVehiclePermissionWith(
 *   PermissionType.MAINTAINER,
 *   async (req) => {
 *     const assignedMaintenance = await repo.findOne({ where: { id: req.body.assignedMaintenanceId }});
 *     return assignedMaintenance?.vehicle.id;
 *   }
 * )
 *
 * @example
 * // Extract from query params
 * requireVehiclePermissionWith(
 *   PermissionType.READ,
 *   async (req) => req.query.vehicleId as string
 * )
 */
export const requireVehiclePermissionWith = (
  permission: PermissionType,
  vehicleIdMapper: (
    req: PermissionRequest,
  ) => Promise<string | null | undefined> | string | null | undefined,
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      const vehicleId = await vehicleIdMapper(req);

      if (!vehicleId) {
        return next(
          new AppError(
            "Could not determine vehicle ID from request",
            400,
            "https://example.com/problems/bad-request",
            "Bad Request",
          ),
        );
      }

      return requireVehiclePermission(vehicleId, permission)(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};
