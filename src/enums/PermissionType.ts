export enum PermissionType {
  READ = "Read",
  MAINTAINER = "Maintainer",
  DRIVER = "Driver",
  FULL = "Full",
}

export const PERMISSION_WEIGHT: Record<PermissionType, number> = {
  [PermissionType.READ]: 1,
  [PermissionType.MAINTAINER]: 2,
  [PermissionType.DRIVER]: 3,
  [PermissionType.FULL]: 4,
};
