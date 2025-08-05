import { z } from "zod";

// Define the schema for the assignment object
export const AssignmentSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  startDate: z.string().datetime().optional(), // Full ISO datetime string, optional (defaults to now)
  endDate: z.string().datetime().optional().nullable(), // Full ISO datetime string, nullable
});

// Schema for updating assignments (all fields optional)
export const AssignmentUpdateSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(), // Full ISO datetime string
  endDate: z.string().datetime().optional().nullable(),
}).refine((data) => {
  // Custom validation: if both startDate and endDate are provided, endDate must be after startDate
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Schema for finishing assignments
export const AssignmentFinishSchema = z.object({
  endDate: z.string().datetime().optional(), // Full ISO datetime string, optional (defaults to now)
});

export type AssignmentInput = z.infer<typeof AssignmentSchema>;
export type AssignmentUpdateInput = z.infer<typeof AssignmentUpdateSchema>;
export type AssignmentFinishInput = z.infer<typeof AssignmentFinishSchema>;
