import { z } from "zod";

export const AssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
});

export const AssignmentUpdateSchema = z
  .object({
    vehicleId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const AssignmentFinishSchema = z.object({
  endDate: z.string().datetime().optional(),
});

export type AssignmentInput = z.infer<typeof AssignmentSchema>;
export type AssignmentUpdateInput = z.infer<typeof AssignmentUpdateSchema>;
export type AssignmentFinishInput = z.infer<typeof AssignmentFinishSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
