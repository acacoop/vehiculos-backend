import { User } from './user';
import { Vehicle } from './vehicle';

export interface Assignment {
  id: string; // UUID
  vehicleId: string; // UUID
  userId: string; // UUID
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, nullable
}

export interface AssignmentWithDetails {
  id: string; // UUID
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, nullable
  user: User;
  vehicle: Vehicle;
}
