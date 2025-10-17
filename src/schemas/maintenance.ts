import { z } from "zod";

export const MaintenanceSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Invalid UUID format for categoryId"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  kilometersFrequency: z.number().int().min(0).optional(),
  daysFrequency: z.number().int().min(0).optional(),
  observations: z.string().optional(),
  instructions: z.string().optional(),
});

export const MaintenanceCreateSchema = MaintenanceSchema.omit({ id: true });

export const MaintenanceUpdateSchema = z.object({
  categoryId: z.string().uuid("Invalid UUID format for categoryId").optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters")
    .optional(),
  kilometersFrequency: z.number().int().min(0).optional(),
  daysFrequency: z.number().int().min(0).optional(),
  observations: z.string().optional(),
  instructions: z.string().optional(),
});

export type MaintenanceInput = z.infer<typeof MaintenanceSchema>;
export type MaintenanceCreateInput = z.infer<typeof MaintenanceCreateSchema>;
export type MaintenanceUpdateInput = z.infer<typeof MaintenanceUpdateSchema>;
export type Maintenance = z.infer<typeof MaintenanceSchema>;
