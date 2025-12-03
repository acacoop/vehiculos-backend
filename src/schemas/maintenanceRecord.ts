import { z } from "zod";

// Define the schema for maintenance record object
export const MaintenanceRecordSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  maintenanceId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().nonnegative(), // This will be used to create a kilometer log
  notes: z.string().optional(),
});

export type MaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>;

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
