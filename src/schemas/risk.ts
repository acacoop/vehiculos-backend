import { z } from "zod";

// Risk indicator item - represents a single risk item with drill-down capability
export interface RiskItem {
  vehicleId: string;
  vehicleLicensePlate: string;
  description: string;
  severity: "high" | "medium" | "low";
  daysOverdue?: number;
}

// Risk summary for dashboard
export interface RiskSummary {
  category: string;
  count: number;
  severity: "high" | "medium" | "low";
}

// Overdue maintenance item
export interface OverdueMaintenanceItem {
  vehicleId: string;
  vehicleLicensePlate: string;
  maintenanceId: string;
  maintenanceName: string;
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
  vehicleId: string;
  vehicleLicensePlate: string;
  lastResponsibleEndDate?: string;
}
