import { z } from "zod";
import { PermissionType } from "../entities/PermissionType";

export const VehicleSelectionSchema = z.object({
  vehicleIds: z.array(z.string().uuid()).default([]),
});
export type VehicleSelectionInput = z.infer<typeof VehicleSelectionSchema>;

export const VehicleACLCreateSchema = z.object({
  aclType: z.enum(["user", "user_group"]),
  entityId: z.string().uuid(),
  permission: z.nativeEnum(PermissionType),
  vehicleSelectionId: z.string().uuid(),
});
export type VehicleACLCreateInput = z.infer<typeof VehicleACLCreateSchema>;
