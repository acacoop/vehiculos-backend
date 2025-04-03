import { z } from "zod";
import { licensePlateRegex } from "./validations";

// Define the schema for the user object
export const VehicleSchema = z.object({
  id: z.number().default(0),
  licensePlate: z.string().regex(licensePlateRegex),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  imgUrl: z.string().url(),
});
