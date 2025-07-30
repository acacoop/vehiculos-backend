import { User } from "./user";
import { Vehicle } from "./vehicle";

export interface Reservation {
  id?: string; // UUID, optional for creation
  vehicleId: string; // UUID
  userId: string; // UUID
  startDate: Date;
  endDate: Date;
}

export interface ReservationWithDetails {
  id: string; // UUID
  startDate: Date;
  endDate: Date;
  user: User;
  vehicle: Vehicle;
}
