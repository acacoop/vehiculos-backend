import { WeekDay } from "./weekday";

export interface Reservation {
  id: number;
  vehicleId: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  // sets de los dias de la semana
  reccurence: Set<WeekDay>;
}
