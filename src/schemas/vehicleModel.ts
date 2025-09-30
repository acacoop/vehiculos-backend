import { z } from "zod";

export const VehicleModelInputSchema = z.object({
  name: z.string().min(1).max(100),
  brandId: z.string().uuid(),
  vehicleType: z.string().min(1).optional(),
});

export const VehicleModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  vehicleType: z.string().optional().nullable(),
  brand: z.object({ id: z.string().uuid(), name: z.string() }),
});

export type VehicleModelInput = z.infer<typeof VehicleModelInputSchema>;
export type VehicleModelType = z.infer<typeof VehicleModelSchema>;
