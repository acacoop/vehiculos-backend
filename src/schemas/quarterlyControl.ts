import { z } from "zod";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

// Define the schema for quarterly control object
export const QuarterlyControlSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  vehicleId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  quarter: z.number().int().min(1).max(4),
  intendedDeliveryDate: z.string(), // ISO date string
  filledBy: z.string().uuid().optional(),
  filledAt: z.string().optional(),
});

export type QuarterlyControl = z.infer<typeof QuarterlyControlSchema>;

// DTO for quarterly control with full nested objects
export interface QuarterlyControlDTO {
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
    category: string;
    title: string;
    status: QuarterlyControlItemStatus;
    observations: string;
  }[];
}
