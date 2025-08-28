// Central application shared type definitions (replacing old interfaces/*)
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: number;
  active: boolean;
  entraId?: string;
  roles?: string[];
};

export type Vehicle = {
  id?: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  imgUrl?: string | null;
  currentResponsible?: VehicleResponsibleWithDetails | null;
};

export type Assignment = {
  id: string;
  vehicleId: string;
  userId: string;
  startDate: string;
  endDate?: string;
};

export type AssignmentWithDetails = {
  id: string;
  startDate: string;
  endDate?: string;
  user: User;
  vehicle: Vehicle;
};

export type VehicleResponsible = {
  id: string;
  vehicleId: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type VehicleResponsibleWithDetails = {
  id: string;
  startDate: string;
  endDate: string | null;
  user: User;
  vehicle: Vehicle;
};

export type VehicleResponsibleInput = {
  vehicleId: string;
  userId: string;
  startDate: string;
  endDate?: string | null;
};

export type VehicleKilometersLog = {
  id?: string;
  vehicleId: string;
  userId: string;
  date: Date;
  kilometers: number;
  createdAt?: Date;
};

export type Reservation = {
  id?: string;
  vehicleId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
};

export type ReservationWithDetails = {
  id: string;
  startDate: Date;
  endDate: Date;
  user: User;
  vehicle: Vehicle;
};

export type MaintenanceCategory = {
  id: string;
  name: string;
};

export type Maintenance = {
  id: string;
  categoryId: string;
  name: string;
  kilometers_frequency?: number;
  days_frequency?: number;
  observations?: string;
  instructions?: string;
};

export type AssignedMaintenance = {
  id?: string;
  vehicleId: string;
  maintenanceId: string;
  kilometersFrequency?: number;
  daysFrequency?: number;
  maintenance_name?: string;
  maintenance_category_name?: string;
  maintenance_observations?: string;
  maintenance_instructions?: string;
  observations?: string;
  instructions?: string;
};

export type MaintenanceRecord = {
  id?: string;
  assignedMaintenanceId: string;
  userId: string;
  date: Date;
  kilometers: number;
  notes?: string;
};

export type MaintenanceVehicleAssignment = {
  id: string;
  vehicleId: string;
  maintenanceId: string;
  kilometersFrequency?: number;
  daysFrequency?: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  imgUrl?: string | null;
  maintenance_observations?: string;
  maintenance_instructions?: string;
  observations?: string;
  instructions?: string;
};
