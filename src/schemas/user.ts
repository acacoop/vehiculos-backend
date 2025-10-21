import { z } from "zod";

// Central user schema – single source of truth (includes optional entraId/roles)
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  cuit: z.string().regex(/^\d{11}$/), // 11 digits as string
  active: z.boolean().default(true),
  entraId: z.string().uuid().or(z.literal("")).default(""),
});

export type User = z.infer<typeof UserSchema>;
