import { z } from "zod";

// Define the schema for the user object
export const AssignedMaintenanceSchema = z.object({
  id: z.number().default(0),
  vehicleId: z.number(),
  maintenanceId: z.number(),
  kilometersFrequency: z.number(),
  recurrencePattern: z.string(),
});
