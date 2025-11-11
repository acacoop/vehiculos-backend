import { z } from "zod";
import { UserSchema } from "@/schemas/user";
import { VehicleSchema } from "@/schemas/vehicle";

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

// Output schema with full user and vehicle objects
export const VehicleKilometersLogOutputSchema = z.object({
  id: z.string().uuid().optional(),
  user: UserSchema,
  vehicle: VehicleSchema,
  date: z.coerce.date(),
  kilometers: z.number().int().nonnegative(),
  // Extended metadata (not always returned)
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

// Schema exclusivo para crear (vehicleId viene por la ruta, id lo genera la DB)
export const VehicleKilometersLogCreateSchema = z.object({
  userId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().int().nonnegative(),
});

// Schema para actualizar (todos los campos opcionales excepto vehicleId)
export const VehicleKilometersLogUpdateSchema = z.object({
  userId: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  date: z.coerce.date().optional(),
  kilometers: z.number().int().nonnegative().optional(),
});

export type VehicleKilometersLog = z.infer<typeof VehicleKilometersLogSchema>;
export type VehicleKilometersLogOutput = z.infer<
  typeof VehicleKilometersLogOutputSchema
>;
export type VehicleKilometersLogCreate = z.infer<
  typeof VehicleKilometersLogCreateSchema
>;
export type VehicleKilometersLogUpdate = z.infer<
  typeof VehicleKilometersLogUpdateSchema
>;
