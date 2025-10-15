import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { PermissionFilterParams } from "../repositories/interfaces/common";
import { PermissionType } from "../entities/PermissionType";
import { UserRoleEnum } from "../entities/UserRoleEnum";
import { UserRoleRepository } from "../repositories/UserRoleRepository";
import { AppDataSource } from "../db";
import { AppError } from "./errorHandler";

/**
 * Extended request interface that includes permission filter parameters
 * for repository queries
 */
export interface PermissionFilterRequest extends AuthenticatedRequest {
  permissionFilter?: PermissionFilterParams;
}

/**
 * Middleware that extracts permission filter parameters for repository queries.
 * This middleware should be used after `requireAuth` to extract user context and
 * determine the appropriate permission filter.
 *
 * @param requiredPermission - The minimum permission level required for the operation (optional)
 * @returns Express middleware function
 *
 * @example
 * // With specific permission level
 * router.get('/vehicles',
 *   requireAuth,
 *   addPermissionFilter(PermissionType.READ),
 *   vehiclesController.getAll
 * );
 *
 * // Without specific permission level (just add user context)
 * router.get('/my-vehicles',
 *   requireAuth,
 *   addPermissionFilter(),
 *   controller.getAll
 * );
 *
 * // In the controller:
 * const { items, total } = await this.service.getAll({
 *   pagination: { limit, offset },
 *   searchParams,
 *   permissions: (req as PermissionFilterRequest).permissionFilter
 * });
 */
export const addPermissionFilter = (requiredPermission?: PermissionType) => {
  const userRoleRepository = new UserRoleRepository(AppDataSource);

  return async (
    req: PermissionFilterRequest,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      // This middleware must be used after requireAuth
      // If there's no user, authentication failed somewhere
      if (!req.user) {
        throw new AppError(
          "Permission filter middleware requires authenticated user. Use requireAuth middleware first.",
          500,
          "https://example.com/problems/internal-error",
          "Internal Server Error",
        );
      }

      // Check if user is ADMIN
      const isAdmin = await userRoleRepository.hasActiveRole(
        req.user.id,
        UserRoleEnum.ADMIN,
      );

      // Build permission filter parameters
      req.permissionFilter = {
        userId: req.user.id,
        userRole: isAdmin ? UserRoleEnum.ADMIN : UserRoleEnum.USER,
        requiredPermission,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};
