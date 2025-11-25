import { z } from "zod";
import { MaintenanceChecklistItemStatus } from "@/enums/MaintenanceChecklistItemStatusEnum";

// Define the schema for maintenance checklist object
export const MaintenanceChecklistSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  vehicleId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  quarter: z.number().int().min(1).max(4),
  intendedDeliveryDate: z.string(), // ISO date string
  filledBy: z.string().uuid().optional(),
  filledAt: z.string().optional(),
});

export type MaintenanceChecklist = z.infer<typeof MaintenanceChecklistSchema>;

// DTO for maintenance checklist with full nested objects
export interface MaintenanceChecklistDTO {
  id: string;
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
  year: number;
  quarter: number;
  intendedDeliveryDate: string;
  filledBy?: {
    id: string;
    firstName: string;
    lastName: string;
    cuit: string;
    email: string;
    entraId: string;
    active: boolean;
  };
  filledAt?: string;
  items: {
    id: string;
    title: string;
    status: MaintenanceChecklistItemStatus;
    observations: string;
  }[];
}
