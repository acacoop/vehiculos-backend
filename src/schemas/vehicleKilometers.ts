import { z } from 'zod';

export const VehicleKilometersLogSchema = z.object({
  id: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.coerce.date(),
  kilometers: z.number().int().nonnegative(),
});

export const VehicleKilometersLogQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});
