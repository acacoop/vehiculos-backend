import { z } from "zod";

// Define the schema for maintenance requirement object
export const MaintenanceRequirementSchema = z
  .object({
    id: z.string().uuid().optional(), // UUID, optional for creation
    modelId: z.string().uuid(),
    maintenanceId: z.string().uuid(),
    kilometersFrequency: z.number().positive().optional(),
    daysFrequency: z.number().positive().optional(),
    observations: z.string().optional(),
    instructions: z.string().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Start date must be in YYYY-MM-DD format",
    }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "End date must be in YYYY-MM-DD format",
      })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // At least one frequency must be provided and be a valid positive value
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
      // If endDate is provided, it must be >= startDate
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

// Define the schema for updating maintenance requirement
export const UpdateMaintenanceRequirementSchema = z
  .object({
    kilometersFrequency: z.number().positive().optional().nullable(),
    daysFrequency: z.number().positive().optional().nullable(),
    observations: z.string().optional().nullable(),
    instructions: z.string().optional().nullable(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Start date must be in YYYY-MM-DD format",
      })
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "End date must be in YYYY-MM-DD format",
      })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // At least one field must be provided for update
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
      // If updating frequencies, at least one must be positive
      const isUpdatingKm = data.kilometersFrequency !== undefined;
      const isUpdatingDays = data.daysFrequency !== undefined;

      // If not updating any frequency, validation passes
      if (!isUpdatingKm && !isUpdatingDays) return true;

      // If updating, ensure at least one is positive (not null and > 0)
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
