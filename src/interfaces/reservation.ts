export interface Reservation {
  id?: string; // UUID, optional for creation
  vehicleId: string; // UUID
  userId: string; // UUID
  startDate: Date;
  endDate: Date;
}
