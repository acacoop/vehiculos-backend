import { PermissionType, PERMISSION_WEIGHT } from "../entities/PermissionType";

/**
 * Get all permission types that satisfy the required permission level
 * based on permission weight hierarchy.
 *
 * For example:
 * - If READ is required, returns [READ, MAINTAINER, DRIVER, FULL]
 * - If DRIVER is required, returns [DRIVER, FULL]
 * - If FULL is required, returns [FULL]
 *
 * @param requiredPermission The minimum permission level required
 * @returns Array of PermissionType values that meet or exceed the required level
 */
export function getAllowedPermissions(
  requiredPermission: PermissionType,
): PermissionType[] {
  const requiredWeight = PERMISSION_WEIGHT[requiredPermission];
  return Object.entries(PERMISSION_WEIGHT)
    .filter(([, weight]) => weight >= requiredWeight)
    .map(([permission]) => permission as PermissionType);
}
