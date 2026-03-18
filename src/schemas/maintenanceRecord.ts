import { z } from "zod";

export const MaintenanceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  maintenanceId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().nonnegative(),
  notes: z.string().optional(),
});

export type MaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>;

export const MaintenanceRecordUpdateSchema = z
  .object({
    date: z.coerce.date().optional(),
    kilometers: z.number().nonnegative().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type MaintenanceRecordUpdate = z.infer<
  typeof MaintenanceRecordUpdateSchema
>;

// DTO for maintenance record with full nested objects
export interface MaintenanceRecordDTO {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    cuit: string;
    email: string;
    entraId: string;
    active: boolean;
  };
  maintenance: {
    id: string;
    categoryId: string;
    category: { name: string };
    name: string;
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    year: number;
    chassisNumber?: string;
    engineNumber?: string;
    transmission?: string;
    fuelType?: string;
    model: {
      id: string;
      name: string;
      vehicleType?: string;
      brand: {
        id: string;
        name: string;
      };
    };
  };
  date: Date;
  kilometersLog: {
    id: string;
    kilometers: number;
    date: Date;
  };
  notes?: string;
}
