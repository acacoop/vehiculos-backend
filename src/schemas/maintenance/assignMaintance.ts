import { z } from "zod";

// Define the schema for assigned maintenance object
export const AssignedMaintenanceSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  vehicleId: z.string().uuid(),
  maintenanceId: z.string().uuid(),
  kilometersFrequency: z.number().optional(),
  daysFrequency: z.number().optional(),
  observations: z.string().optional(),
  instructions: z.string().optional(),
});

// Define the schema for updating assigned maintenance (only frequency fields)
export const UpdateAssignedMaintenanceSchema = z
  .object({
    kilometersFrequency: z.number().optional(),
    daysFrequency: z.number().optional(),
    observations: z.string().optional(),
    instructions: z.string().optional(),
  })
  .refine(
    (data) =>
      data.kilometersFrequency !== undefined ||
      data.daysFrequency !== undefined,
    {
      message:
        "At least one field (kilometersFrequency or daysFrequency) must be provided for update",
    },
  );

export type AssignedMaintenance = z.infer<typeof AssignedMaintenanceSchema>;
export type UpdateAssignedMaintenance = z.infer<
  typeof UpdateAssignedMaintenanceSchema
>;
