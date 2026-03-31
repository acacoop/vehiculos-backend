import { z } from "zod";

export const PushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export const PushTokenDeleteSchema = z.object({
  token: z.string().min(1),
});

export type PushTokenInput = z.infer<typeof PushTokenSchema>;
export type PushTokenDeleteInput = z.infer<typeof PushTokenDeleteSchema>;
