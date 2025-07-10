export interface Assignment {
  id: string; // UUID
  vehicleId: string; // UUID
  userId: string; // UUID
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, nullable
}
