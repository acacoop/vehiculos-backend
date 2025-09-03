import { z } from "zod";

// Define the schema for the maintenance object
export const MaintenanceSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  categoryId: z.string().uuid("Invalid UUID format for categoryId"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  // Optional extended fields (legacy support)
  kilometersFrequency: z.number().int().positive().optional(),
  daysFrequency: z.number().int().positive().optional(),
  observations: z.string().optional(),
  instructions: z.string().optional(),
});

// Schema for creating maintenances (id is excluded)
export const MaintenanceCreateSchema = MaintenanceSchema.omit({ id: true });

// Schema for updating maintenances (all fields optional)
export const MaintenanceUpdateSchema = z.object({
  categoryId: z.string().uuid("Invalid UUID format for categoryId").optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters")
    .optional(),
});

export type MaintenanceInput = z.infer<typeof MaintenanceSchema>;
export type MaintenanceCreateInput = z.infer<typeof MaintenanceCreateSchema>;
export type MaintenanceUpdateInput = z.infer<typeof MaintenanceUpdateSchema>;
export type Maintenance = z.infer<typeof MaintenanceSchema>;
