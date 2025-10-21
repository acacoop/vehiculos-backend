import { z } from "zod";
import { PermissionType } from "@/utils";

/**
 * Schema for creating a new VehicleACL entry
 * Maps a user directly to a vehicle with a permission level and time period
 */
export const VehicleACLCreateSchema = z.object({
  userId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  permission: z.nativeEnum(PermissionType),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
});

export type VehicleACLCreateInput = z.infer<typeof VehicleACLCreateSchema>;

/**
 * Schema for updating a VehicleACL entry
 */
export const VehicleACLUpdateSchema = z.object({
  permission: z.nativeEnum(PermissionType).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional().nullable(),
});

export type VehicleACLUpdateInput = z.infer<typeof VehicleACLUpdateSchema>;
