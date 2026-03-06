import { z } from "zod";

export const VehicleResponsibleSchema = z.object({
  id: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  ceco: z.string().length(8, "CECO debe tener exactamente 8 caracteres"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type VehicleResponsible = z.infer<typeof VehicleResponsibleSchema>;
export type VehicleResponsibleInput = Omit<
  VehicleResponsible,
  "id" | "createdAt" | "updatedAt"
>;
