import { VehicleResponsibleWithDetails } from './vehicleResponsible';

export interface Vehicle {
  id?: string; // UUID, optional for creation
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  imgUrl?: string; // Optional image URL
  currentResponsible?: VehicleResponsibleWithDetails | null; // Optional, only included in detailed views
}
