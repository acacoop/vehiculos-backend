import { z } from "zod";
import { PermissionType } from "../entities/Roles";

export const CecoRangeInputSchema = z.object({
  id: z.string().uuid().optional(),
  startCeco: z.number().int(),
  endCeco: z.number().int(),
});

export const RoleInputSchema = z.object({
  permission: z.nativeEnum(PermissionType),
  cecoRanges: z.array(CecoRangeInputSchema).optional(),
});

export const RoleSchema = z.object({
  id: z.string().uuid(),
  permission: z.nativeEnum(PermissionType),
  cecoRanges: z.array(CecoRangeInputSchema).optional(),
});

export type CecoRangeInput = z.infer<typeof CecoRangeInputSchema>;
export type RoleInput = z.infer<typeof RoleInputSchema>;
export type Role = z.infer<typeof RoleSchema>;
