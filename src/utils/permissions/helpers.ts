import { PermissionType, PERMISSION_WEIGHT } from "./enums";

export function getAllowedPermissions(
  requiredPermission: PermissionType,
): PermissionType[] {
  const requiredWeight = PERMISSION_WEIGHT[requiredPermission];
  return Object.entries(PERMISSION_WEIGHT)
    .filter(([, weight]) => weight >= requiredWeight)
    .map(([permission]) => permission as PermissionType);
}
