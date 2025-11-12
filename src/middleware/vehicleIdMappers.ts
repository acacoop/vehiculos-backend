import { AppDataSource } from "@/db";
import { MaintenanceRecord } from "@/entities/MaintenanceRecord";
import { PermissionRequest } from "@/middleware/permission";

/**
 * Collection of mapper functions to extract vehicleId from requests.
 * These are used with requireVehiclePermissionWith middleware.
 */

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
    relations: ["vehicle"],
  });

  return record?.vehicle?.id ?? null;
};

/**
 * Maps maintenance record DTO to vehicle ID.
 * Useful for maintenance record DTOs returned by the service.
 */
export const vehicleIdFromMaintenanceRecordDTO = (
  entity: { vehicle?: { id?: string } } | null,
): string | null | undefined => {
  return entity?.vehicle?.id ?? null;
};
