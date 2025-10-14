import { z } from "zod";

export const CecoRangeSchema = z
  .object({
    vehicleSelectionId: z.string().uuid(),
    startCeco: z
      .string()
      .regex(/^\d{8}$/, "startCeco must be an 8-digit numeric string"),
    endCeco: z
      .string()
      .regex(/^\d{8}$/, "endCeco must be an 8-digit numeric string"),
  })
  .refine((data) => Number(data.startCeco) <= Number(data.endCeco), {
    message: "startCeco must be less than or equal to endCeco",
    path: ["startCeco"],
  });

export type CecoRangeInput = z.infer<typeof CecoRangeSchema>;
