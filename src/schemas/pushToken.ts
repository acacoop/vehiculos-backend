import { z } from "zod";

const ExpoPushTokenSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(
    /^ExponentPushToken\[[A-Za-z0-9-_]+\]$/,
    "Invalid Expo push token format",
  );
export const PushTokenSchema = z.object({
  token: ExpoPushTokenSchema,
  platform: z.enum(["ios", "android"]),
});
export const PushTokenDeleteSchema = z.object({
  token: ExpoPushTokenSchema,
});

export type PushTokenInput = z.infer<typeof PushTokenSchema>;
export type PushTokenDeleteInput = z.infer<typeof PushTokenDeleteSchema>;
