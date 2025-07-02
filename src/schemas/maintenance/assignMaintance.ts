import { z } from "zod";

// Define the schema for assigned maintenance object
export const AssignedMaintenanceSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  vehicleId: z.string().uuid(),
  maintenanceId: z.string().uuid(), 
  kilometersFrequency: z.number().optional(),
  daysFrequency: z.number().optional(),
});
