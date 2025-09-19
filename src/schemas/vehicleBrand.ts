import { z } from "zod";

export const VehicleBrandInputSchema = z.object({
  name: z.string().min(1).max(100),
});

export const VehicleBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type VehicleBrandInput = z.infer<typeof VehicleBrandInputSchema>;
export type VehicleBrand = z.infer<typeof VehicleBrandSchema>;
