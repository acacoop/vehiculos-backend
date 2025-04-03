import { z } from "zod";
import { parseStringToWeekDays } from "../interfaces/weekday";

// Define the schema for the user object
export const ReservationSchema = z.object({
  id: z.number().default(0),
  vehicleId: z.number(),
  userId: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  reccurence: z.string().transform(parseStringToWeekDays),
});
