import { z } from "zod";

// Define the schema for maintenance record object
export const MaintenanceRecordSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  assignedMaintenanceId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().positive(),
  notes: z.string().optional(),
});

export type MaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>;
