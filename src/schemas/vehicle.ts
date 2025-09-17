import { z } from "zod";
import { licensePlateRegex } from "./validations";

// Define the schema for the vehicle object
export const VehicleSchema = z.object({
  id: z.string().uuid().optional(),
  licensePlate: z.string().regex(licensePlateRegex),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
});

export type Vehicle = z.infer<typeof VehicleSchema>;
