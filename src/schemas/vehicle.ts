import { z } from "zod";
import { licensePlateRegex } from "./validations";

// Define the schema for the vehicle object
export const VehicleSchema = z.object({
  id: z.string().uuid().optional(),
  licensePlate: z.string().regex(licensePlateRegex),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
});

export type Vehicle = z.infer<typeof VehicleSchema>;
