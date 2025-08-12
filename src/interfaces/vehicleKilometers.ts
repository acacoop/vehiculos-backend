export interface VehicleKilometersLog {
  id?: string;
  vehicleId: string;
  userId: string;
  date: Date; // timestamp
  kilometers: number;
  createdAt?: Date;
}
