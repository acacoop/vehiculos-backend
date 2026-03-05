import { z } from "zod";

export const MaintenanceRequirementSchema = z
  .object({
    id: z.string().uuid().optional(),
    modelId: z.string().uuid(),
    maintenanceId: z.string().uuid(),
    kilometersFrequency: z.number().positive().optional(),
    daysFrequency: z.number().positive().optional(),
    observations: z.string().optional(),
    instructions: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasKilometers =
        data.kilometersFrequency !== undefined && data.kilometersFrequency > 0;
      const hasDays =
        data.daysFrequency !== undefined && data.daysFrequency > 0;
      return hasKilometers || hasDays;
    },
    {
      message:
        "At least one frequency (kilometers or days) must be specified with a value greater than 0",
      path: ["kilometersFrequency"],
    },
  )
  .refine(
    (data) => {
      if (data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"],
    },
  );

export const UpdateMaintenanceRequirementSchema = z
  .object({
    kilometersFrequency: z.number().positive().optional().nullable(),
    daysFrequency: z.number().positive().optional().nullable(),
    observations: z.string().optional().nullable(),
    instructions: z.string().optional().nullable(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      return (
        data.kilometersFrequency !== undefined ||
        data.daysFrequency !== undefined ||
        data.observations !== undefined ||
        data.instructions !== undefined ||
        data.startDate !== undefined ||
        data.endDate !== undefined
      );
    },
    {
      message: "At least one field must be provided for update",
    },
  )
  .refine(
    (data) => {
      const isUpdatingKm = data.kilometersFrequency !== undefined;
      const isUpdatingDays = data.daysFrequency !== undefined;

      if (!isUpdatingKm && !isUpdatingDays) return true;

      const kmValue = data.kilometersFrequency ?? 0;
      const daysValue = data.daysFrequency ?? 0;
      return kmValue > 0 || daysValue > 0;
    },
    {
      message:
        "At least one frequency (kilometers or days) must be greater than 0",
      path: ["kilometersFrequency"],
    },
  );

export type MaintenanceRequirement = z.infer<
  typeof MaintenanceRequirementSchema
>;
export type UpdateMaintenanceRequirement = z.infer<
  typeof UpdateMaintenanceRequirementSchema
>;
