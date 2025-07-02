import { z } from "zod";
import { licensePlateRegex } from "./validations";

// Define the schema for the vehicle object
export const VehicleSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  licensePlate: z.string().regex(licensePlateRegex),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  imgUrl: z.string().url(),
});
