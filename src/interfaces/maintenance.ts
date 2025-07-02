export interface MaintenanceCategory {
  id: string; // UUID
  name: string;
}

export interface Maintenance {
  id: string; // UUID
  categoryId: string; // UUID
  name: string;
}

export interface AssignedMaintenance {
  id: string; // UUID
  vehicleId: string; // UUID
  maintenanceId: string; // UUID
  kilometersFrequency: number;
  daysFrecuency: number;
}

export interface MaintenanceRecord {
  id: string; // UUID
  assignedMaintenanceId: string; // UUID
  userId: string; // UUID
  date: Date;
  kilometer: number;
  notes: string;
}
