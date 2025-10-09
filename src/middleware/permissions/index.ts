// Public API - only export what's needed by consumers
export {
  initializePermissionChecker,
  requirePermission,
  requireVehiclePermission,
  requireAdminRole,
} from "./middleware";

// Export types that might be needed for type checking in routes
export type {
  PermissionCheckOptions,
  VehiclePermissionCheckOptions,
  RoleCheckOptions,
  PermissionRequest,
} from "./types";
