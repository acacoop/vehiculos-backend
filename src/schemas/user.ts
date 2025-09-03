import { z } from "zod";

// Central user schema – single source of truth (includes optional entraId/roles)
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  dni: z.number(),
  active: z.boolean().default(true),
  entraId: z.string().uuid().or(z.literal("")).default(""),
  roles: z.array(z.string()).optional(),
});

export type User = z.infer<typeof UserSchema>;
