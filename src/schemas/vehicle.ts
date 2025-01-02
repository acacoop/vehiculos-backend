import { z } from "zod";

// Define the schema for the user object
export const VehicleSchema = z.object({
  id: z.number(),
  licensePlate: z
    .string()
    .regex(/^[A-Z]{2}[0-9]{3}[A-Z]{2}$|^[A-Z]{3}[0-9]{3}$/),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  imgUrl: z.string().url(),
});
