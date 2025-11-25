import { z } from "zod";
import { MaintenanceChecklistItemStatus } from "@/enums/MaintenanceChecklistItemStatusEnum";

// Define the schema for maintenance checklist item object
export const MaintenanceChecklistItemSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  maintenanceChecklistId: z.string().uuid(),
  category: z.string(),
  title: z.string(),
  status: z.nativeEnum(MaintenanceChecklistItemStatus),
  observations: z.string(),
});

export type MaintenanceChecklistItem = z.infer<
  typeof MaintenanceChecklistItemSchema
>;

// DTO for maintenance checklist item with full nested objects
export interface MaintenanceChecklistItemDTO {
  id: string;
  maintenanceChecklistId: string;
  category: string;
  title: string;
  status: MaintenanceChecklistItemStatus;
  observations: string;
}
