import { z } from "zod";

// Define the schema for maintenance record object
export const MaintenanceRecordSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  assignedMaintenanceId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().positive(),
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
  assignedMaintenance: {
    id: string;
    vehicle: {
      id: string;
      licensePlate: string;
      year: number;
      chassisNumber?: string | null;
      engineNumber?: string | null;
      transmission?: string | null;
      fuelType?: string | null;
      model: {
        id: string;
        name: string;
        vehicleType?: string | null;
        brand: {
          id: string;
          name: string;
        };
      };
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
    kilometersFrequency?: number;
    daysFrequency?: number;
    observations?: string;
    instructions?: string;
  };
  date: Date;
  kilometers: number;
  notes?: string;
}
