import { Response, NextFunction } from "express";
import { DataSource } from "typeorm";
import { AppError } from "../errorHandler";
import { PermissionType } from "../../entities/PermissionType";
import { UserRoleEnum } from "../../entities/UserRoleEnum";
import { PermissionChecker } from "./checker";
import { PermissionCheckOptions, PermissionRequest } from "./types";

// Global permission checker instance (initialized on app startup)
let permissionChecker: PermissionChecker | null = null;

/**
 * Initializes the permission checker with a DataSource.
 * Must be called during application startup before using permission middleware.
 */
export const initializePermissionChecker = (dataSource: DataSource) => {
  permissionChecker = new PermissionChecker(dataSource);
};

/**
 * Express middleware factory for permission checks.
 * Verifies that the authenticated user has the required permission.
 *
 * @param options - Permission check options (vehicle permission or role check)
 * @returns Express middleware function
 * @throws AppError 401 if user is not authenticated
 * @throws AppError 403 if user lacks required permission
 * @throws AppError 500 if permission checker is not initialized
 *
 * @example
 * // Check vehicle permission
 * app.get('/vehicles/:id',
 *   requirePermission({
 *     type: 'vehicle',
 *     vehicleId: req.params.id,
 *     permission: PermissionType.READ
 *   }),
 *   vehicleController.getVehicle
 * );
 *
 * @example
 * // Check role
 * app.post('/admin/settings',
 *   requirePermission({
 *     type: 'role',
 *     role: UserRoleEnum.ADMIN
 *   }),
 *   adminController.updateSettings
 * );
 */
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

/**
 * Convenience middleware for checking vehicle permissions.
 *
 * @param vehicleId - The vehicle ID to check permission for
 * @param permission - The required permission level (READ, DRIVER, FULL, etc.)
 * @returns Express middleware function
 *
 * @example
 * app.put('/vehicles/:id',
 *   requireVehiclePermission(req.params.id, PermissionType.FULL),
 *   vehicleController.updateVehicle
 * );
 */
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
 * Convenience middleware for checking admin role.
 * Ensures the user has an active ADMIN role.
 *
 * @returns Express middleware function
 *
 * @example
 * app.delete('/users/:id',
 *   requireAdminRole(),
 *   userController.deleteUser
 * );
 */
export const requireAdminRole = () =>
  requirePermission({
    type: "role",
    role: UserRoleEnum.ADMIN,
  });
