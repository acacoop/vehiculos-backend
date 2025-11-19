import { z } from "zod";

// Define the schema for maintenance checklist item object
export const MaintenanceChecklistItemSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  maintenanceChecklistId: z.string().uuid(),
  title: z.string(),
  passed: z.boolean(),
  observations: z.string(),
});

export type MaintenanceChecklistItem = z.infer<
  typeof MaintenanceChecklistItemSchema
>;

// DTO for maintenance checklist item with full nested objects
export interface MaintenanceChecklistItemDTO {
  id: string;
  maintenanceChecklist: {
    id: string;
    vehicle: {
      id: string;
      licensePlate: string;
    };
    year: number;
    quarter: number;
    intendedDeliveryDate: string;
    filledBy?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    filledAt?: string;
  };
  title: string;
  passed: boolean;
  observations: string;
}
