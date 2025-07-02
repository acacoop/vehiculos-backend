import { z } from "zod";

// Define the schema for the reservation object
export const ReservationSchema = z.object({
  id: z.string().uuid().optional(), // UUID, optional for creation
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(), 
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
