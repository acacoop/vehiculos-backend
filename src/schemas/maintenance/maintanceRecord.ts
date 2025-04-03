import { z } from "zod";

// Define the schema for the user object
export const MaintenanceRecordSchema = z.object({
  id: z.number().default(0),
  assignedMaintenanceId: z.number(),
  userId: z.number(),
  date: z.date().default(new Date()),
  kilometer: z.number(),
  observations: z.string().default(""),
});
