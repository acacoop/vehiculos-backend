import { z } from "zod";
import { UserRoleEnum } from "@/utils";

export const UserRoleInputSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.nativeEnum(UserRoleEnum),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
});

export const UserRoleUpdateSchema = z.object({
  role: z.nativeEnum(UserRoleEnum).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional().nullable(),
});

export const UserRoleEndSchema = z.object({
  endTime: z.coerce.date().optional(),
});

export type UserRoleInput = z.infer<typeof UserRoleInputSchema>;
export type UserRoleUpdate = z.infer<typeof UserRoleUpdateSchema>;
export type UserRoleEnd = z.infer<typeof UserRoleEndSchema>;
