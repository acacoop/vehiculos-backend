import { User } from './user';
import { Vehicle } from './vehicle';

export interface VehicleResponsible {
  id: string;
  vehicleId: string;
  userId: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string | null; // ISO date string or null for active
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleResponsibleWithDetails {
  id: string;
  startDate: string;
  endDate: string | null;
  user: User;
  vehicle: Vehicle;
}

export interface VehicleResponsibleInput {
  vehicleId: string;
  userId: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate?: string | null; // Optional, defaults to null (active)
}
