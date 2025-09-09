import { z } from "zod";

// Base schema representing a stored kilometers log (includes vehicleId & optional id)
export const VehicleKilometersLogSchema = z.object({
  id: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().int().nonnegative(),
  // Extended metadata (not always returned)
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
// Schema exclusivo para crear (vehicleId viene por la ruta, id lo genera la DB)
export const VehicleKilometersLogCreateSchema = z.object({
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().int().nonnegative(),
});

export type VehicleKilometersLog = z.infer<typeof VehicleKilometersLogSchema>;
export type VehicleKilometersLogCreate = z.infer<
  typeof VehicleKilometersLogCreateSchema
>;
