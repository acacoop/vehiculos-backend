import { z } from "zod";

// ============================================
// Query Parameters Schemas - Per Endpoint
// ============================================

// Summary endpoint - general filters (no pagination needed)
export const RisksSummaryFiltersSchema = z.object({
  toleranceDays: z.coerce.number().min(0).optional().default(0),
  daysWithoutUpdate: z.coerce.number().min(1).optional().default(30),
});

// Vehicles without responsible filters (pagination handled by parsePaginationQuery)
export const VehiclesWithoutResponsibleFiltersSchema = z.object({
  search: z.string().optional(),
});

// Overdue maintenance filters
export const OverdueMaintenanceFiltersSchema = z.object({
  search: z.string().optional(),
  toleranceDays: z.coerce.number().min(0).optional().default(0),
  maintenanceId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
});

// Overdue quarterly controls filters
export const OverdueQuarterlyControlsFiltersSchema = z.object({
  search: z.string().optional(),
  toleranceDays: z.coerce.number().min(0).optional().default(0),
  year: z.coerce.number().min(2000).max(2100).optional(),
  quarter: z.coerce.number().min(1).max(4).optional(),
});

// Quarterly controls with errors filters
export const QuarterlyControlsWithErrorsFiltersSchema = z.object({
  search: z.string().optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
  quarter: z.coerce.number().min(1).max(4).optional(),
  minRejectedItems: z.coerce.number().min(1).optional().default(1),
});

// Vehicles without recent kilometers filters
export const VehiclesWithoutRecentKilometersFiltersSchema = z.object({
  search: z.string().optional(),
  daysWithoutUpdate: z.coerce.number().min(1).optional().default(30),
});

// Legacy combined filters (for backwards compatibility)
export const RisksFiltersSchema = z.object({
  toleranceDays: z.coerce.number().optional().default(0),
  daysWithoutUpdate: z.coerce.number().optional().default(30),
});

export type RisksFilters = z.infer<typeof RisksFiltersSchema>;
export type RisksSummaryFilters = z.infer<typeof RisksSummaryFiltersSchema>;
export type VehiclesWithoutResponsibleFilters = z.infer<
  typeof VehiclesWithoutResponsibleFiltersSchema
> & { limit: number; offset: number };
export type OverdueMaintenanceFilters = z.infer<
  typeof OverdueMaintenanceFiltersSchema
> & { limit: number; offset: number };
export type OverdueQuarterlyControlsFilters = z.infer<
  typeof OverdueQuarterlyControlsFiltersSchema
> & { limit: number; offset: number };
export type QuarterlyControlsWithErrorsFilters = z.infer<
  typeof QuarterlyControlsWithErrorsFiltersSchema
> & { limit: number; offset: number };
export type VehiclesWithoutRecentKilometersFilters = z.infer<
  typeof VehiclesWithoutRecentKilometersFiltersSchema
> & { limit: number; offset: number };

// ============================================
// Risks Interfaces
// ============================================

// Risks summary for dashboard
export interface RisksSummary {
  key: string;
  label: string;
  count: number;
  severity: "high" | "medium" | "low";
}

// Overdue maintenance requirement (grouped by requirement, not vehicle)
export interface OverdueMaintenanceRequirement {
  id: string; // Same as maintenanceRequirementId, for DataGrid compatibility
  maintenanceRequirementId: string;
  maintenanceId: string;
  maintenanceName: string;
  modelId: string;
  modelName: string;
  brandName: string;
  daysFrequency?: number;
  kilometersFrequency?: number;
  affectedVehiclesCount: number;
  vehicles: OverdueMaintenanceVehicle[];
}

export interface OverdueMaintenanceVehicle {
  vehicleId: string;
  vehicleLicensePlate: string;
  dueDate?: string;
  dueKilometers?: number;
  currentKilometers?: number;
  daysOverdue?: number;
  kilometersOverdue?: number;
}

// Flat overdue maintenance vehicle (for disaggregated view)
export interface OverdueMaintenanceVehicleFlat {
  id: string; // Composite: vehicleId-maintenanceRequirementId
  vehicleId: string;
  vehicleLicensePlate: string;
  maintenanceRequirementId: string;
  maintenanceId: string;
  maintenanceName: string;
  modelId: string;
  modelName: string;
  brandName: string;
  daysFrequency?: number;
  kilometersFrequency?: number;
  dueDate?: string;
  dueKilometers?: number;
  currentKilometers?: number;
  daysOverdue?: number;
  kilometersOverdue?: number;
}

// Overdue quarterly control
export interface OverdueQuarterlyControl {
  id: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  year: number;
  quarter: number;
  intendedDeliveryDate: string;
  daysOverdue: number;
  pendingItemsCount: number;
  totalItemsCount: number;
}

// Quarterly control with errors
export interface QuarterlyControlWithErrors {
  id: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  year: number;
  quarter: number;
  rejectedItemsCount: number;
}

// Vehicle without responsible
export interface VehicleWithoutResponsible {
  id: string; // Same as vehicleId, for DataGrid compatibility
  vehicleId: string;
  vehicleLicensePlate: string;
  lastResponsibleEndDate?: string;
}

// Vehicle without recent kilometer records
export interface VehicleWithoutRecentKilometers {
  id: string; // Same as vehicleId, for DataGrid compatibility
  vehicleId: string;
  vehicleLicensePlate: string;
  lastKilometerDate?: string;
  lastKilometers?: number;
  daysSinceLastUpdate: number;
}
