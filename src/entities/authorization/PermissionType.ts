export enum PermissionType {
  FULL = "Full",
  DRIVER = "Driver",
  MAINTAINER = "Maintainer",
  READ = "Read",
}

export const PERMISSION_WEIGHT: Record<PermissionType, number> = {
  [PermissionType.READ]: 1,
  [PermissionType.MAINTAINER]: 2,
  [PermissionType.DRIVER]: 3,
  [PermissionType.FULL]: 4,
};
