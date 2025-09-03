import { z } from "zod";

// Schema for basic vehicle responsible record
export const VehicleResponsibleSchema = z.object({
  id: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  startDate: z.string(), // stored as YYYY-MM-DD
  endDate: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type VehicleResponsible = z.infer<typeof VehicleResponsibleSchema>;
export type VehicleResponsibleInput = Omit<
  VehicleResponsible,
  "id" | "createdAt" | "updatedAt"
>;