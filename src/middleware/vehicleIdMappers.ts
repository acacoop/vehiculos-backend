import { AppDataSource } from "db";
import { AssignedMaintenance } from "entities/AssignedMaintenance";
import { MaintenanceRecord } from "entities/MaintenanceRecord";
import { Assignment } from "entities/Assignment";
import { PermissionRequest } from "./permission";

/**
 * Collection of mapper functions to extract vehicleId from requests.
 * These are used with requireVehiclePermissionWith middleware.
 */

/**
 * Extracts vehicleId by looking up an AssignedMaintenance entity.
 * Useful for maintenance records where the body contains assignedMaintenanceId.
 */
export const vehicleIdFromAssignedMaintenance = async (
  req: PermissionRequest,
): Promise<string | null> => {
  const assignedMaintenanceId = req.body?.assignedMaintenanceId;
  if (!assignedMaintenanceId) {
    return null;
  }

  const assignedMaintenanceRepo =
    AppDataSource.getRepository(AssignedMaintenance);
  const assignedMaintenance = await assignedMaintenanceRepo.findOne({
    where: { id: assignedMaintenanceId },
    relations: ["vehicle"],
  });

  return assignedMaintenance?.vehicle?.id ?? null;
};

/**
 * Extracts vehicleId from query parameters.
 */
export const vehicleIdFromQuery = (req: PermissionRequest): string | null => {
  return (req.query?.vehicleId as string) ?? null;
};

/**
 * Extracts vehicleId from request body (for POST/PUT/PATCH).
 */
export const vehicleIdFromBody = (req: PermissionRequest): string | null => {
  return req.body?.vehicleId ?? null;
};

/**
 * Maps maintenance record ID from params to vehicle ID by looking up the record.
 * Useful for GET /maintenance-records/:id endpoints.
 */
export const vehicleIdFromMaintenanceRecord = async (
  req: PermissionRequest,
): Promise<string | null> => {
  const recordId = req.params?.id;
  if (!recordId) {
    return null;
  }

  const repo = AppDataSource.getRepository(MaintenanceRecord);
  const record = await repo.findOne({
    where: { id: recordId },
    relations: ["assignedMaintenance", "assignedMaintenance.vehicle"],
  });

  return record?.assignedMaintenance?.vehicle?.id ?? null;
};

/**
 * Maps assignment ID from params to vehicle ID by looking up the assignment.
 * Useful for GET /assignments/:id endpoints.
 */
export const vehicleIdFromAssignment = async (
  req: PermissionRequest,
): Promise<string | null> => {
  const assignmentId = req.params?.id;
  if (!assignmentId) {
    return null;
  }

  const repo = AppDataSource.getRepository(Assignment);
  const assignment = await repo.findOne({
    where: { id: assignmentId },
    relations: ["vehicle"],
  });

  return assignment?.vehicle?.id ?? null;
};
