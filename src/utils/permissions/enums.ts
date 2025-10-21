export enum UserRoleEnum {
  USER = "user",
  ADMIN = "admin",
}

export enum PermissionType {
  READ = "Read",
  MAINTAINER = "Maintainer",
  DRIVER = "Driver",
  FULL = "Full",
}

export const USER_ROLES_WEIGHT: Record<UserRoleEnum, number> = {
  [UserRoleEnum.USER]: 1,
  [UserRoleEnum.ADMIN]: 2,
};

export const PERMISSION_WEIGHT: Record<PermissionType, number> = {
  [PermissionType.READ]: 1,
  [PermissionType.MAINTAINER]: 2,
  [PermissionType.DRIVER]: 3,
  [PermissionType.FULL]: 4,
};
