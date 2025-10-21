import { z } from "zod";

// Define the schema for the maintenance category object
export const MaintenanceCategorySchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
});

// Schema for creating maintenance categories (id is excluded)
export const MaintenanceCategoryCreateSchema = MaintenanceCategorySchema.omit({
  id: true,
});

// Schema for updating maintenance categories (all fields optional)
export const MaintenanceCategoryUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters")
    .optional(),
});

export type MaintenanceCategoryInput = z.infer<
  typeof MaintenanceCategorySchema
>;
export type MaintenanceCategoryCreateInput = z.infer<
  typeof MaintenanceCategoryCreateSchema
>;
export type MaintenanceCategoryUpdateInput = z.infer<
  typeof MaintenanceCategoryUpdateSchema
>;
export type MaintenanceCategory = z.infer<typeof MaintenanceCategorySchema>;
