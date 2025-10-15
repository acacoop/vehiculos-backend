/**
 * Central location for all application enums
 */

/**
 * User roles in the system
 */
export enum UserRoleEnum {
  USER = "user",
  ADMIN = "admin",
}

/**
 * Permission types for vehicle access control
 */
export enum PermissionType {
  READ = "Read",
  MAINTAINER = "Maintainer",
  DRIVER = "Driver",
  FULL = "Full",
}

/**
 * Weight/priority mapping for user roles
 * Higher number = more privileges
 */
export const USER_ROLES_WEIGHT: Record<UserRoleEnum, number> = {
  [UserRoleEnum.USER]: 1,
  [UserRoleEnum.ADMIN]: 2,
};

/**
 * Weight/priority mapping for permission types
 * Higher number = more privileges
 * Hierarchy: READ < MAINTAINER < DRIVER < FULL
 */
export const PERMISSION_WEIGHT: Record<PermissionType, number> = {
  [PermissionType.READ]: 1,
  [PermissionType.MAINTAINER]: 2,
  [PermissionType.DRIVER]: 3,
  [PermissionType.FULL]: 4,
};
