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
  id?: string; // UUID
  vehicleId: string; // UUID
  maintenanceId: string; // UUID
  kilometersFrequency?: number;
  daysFrequency?: number;
  // Additional fields from JOIN with maintenances table
  maintenance_name?: string;
  maintenance_category_name?: string;
}

export interface MaintenanceRecord {
  id?: string; // UUID
  assignedMaintenanceId: string; // UUID
  userId: string; // UUID
  date: Date;
  kilometers: number;
  notes?: string;
}

// Interface for vehicles assigned to a specific maintenance
export interface MaintenanceVehicleAssignment {
  id: string; // assignment id
  vehicleId: string;
  maintenanceId: string;
  kilometersFrequency?: number;
  daysFrequency?: number;
  // Vehicle details
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  imgUrl?: string;
}
