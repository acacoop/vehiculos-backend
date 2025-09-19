import { z } from "zod";
import { licensePlateRegex } from "./validations";

// Input schema for creating/updating a vehicle
export const VehicleInputSchema = z.object({
  licensePlate: z.string().regex(licensePlateRegex),
  modelId: z.string().uuid(),
  year: z.number(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
});

// For updates (PATCH/PUT) all fields optional except none required
export const VehicleUpdateSchema = VehicleInputSchema.partial().extend({
  licensePlate: VehicleInputSchema.shape.licensePlate.optional(),
});

// Output schema (nested model + brand)
export const VehicleSchema = z.object({
  id: z.string().uuid(),
  licensePlate: z.string(),
  year: z.number(),
  chassisNumber: z.string().optional().nullable(),
  engineNumber: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  transmission: z.string().optional().nullable(),
  fuelType: z.string().optional().nullable(),
  model: z.object({
    id: z.string().uuid(),
    name: z.string(),
    brand: z.object({ id: z.string().uuid(), name: z.string() }),
  }),
});

export type VehicleInput = z.infer<typeof VehicleInputSchema>;
export type VehicleUpdate = z.infer<typeof VehicleUpdateSchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;
