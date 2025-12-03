import { z } from "zod";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

// Define the schema for quarterly control item object
export const QuarterlyControlItemSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  quarterlyControlId: z.string().uuid(),
  category: z.string(),
  title: z.string(),
  status: z.nativeEnum(QuarterlyControlItemStatus),
  observations: z.string(),
});

export type QuarterlyControlItem = z.infer<typeof QuarterlyControlItemSchema>;

// DTO for quarterly control item with full nested objects
export interface QuarterlyControlItemDTO {
  id: string;
  quarterlyControlId: string;
  category: string;
  title: string;
  status: QuarterlyControlItemStatus;
  observations: string;
}
