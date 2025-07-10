import { z } from "zod";

// Define the schema for the assignment object
export const AssignmentSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // ISO date string (YYYY-MM-DD), optional (defaults to today)
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), // ISO date string (YYYY-MM-DD), nullable
});

export type AssignmentInput = z.infer<typeof AssignmentSchema>;
