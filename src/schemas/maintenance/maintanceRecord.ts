import { z } from "zod";

// Define the schema for maintenance record object
export const MaintenanceRecordSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  // Either provide the assignedMaintenanceId directly, or provide vehicleId + maintenanceId
  assignedMaintenanceId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  maintenanceId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().positive(),
  notes: z.string().optional(),
});

// Require either assignedMaintenanceId or both vehicleId and maintenanceId
export const MaintenanceRecordCreateSchema = MaintenanceRecordSchema.refine(
  (data) =>
    !!data.assignedMaintenanceId || (!!data.vehicleId && !!data.maintenanceId),
  {
    message:
      "Provide either assignedMaintenanceId or both vehicleId and maintenanceId",
    path: ["assignedMaintenanceId"],
  }
);
