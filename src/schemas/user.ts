import { z } from "zod";

// Define the schema for the user object
export const UserSchema = z.object({
  id: z.number().default(0),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  dni: z.number(),
});
