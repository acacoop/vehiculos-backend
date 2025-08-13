import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { VehicleKilometersLogCreateSchema } from '../schemas/vehicleKilometers';
import { getVehicleKilometers, addVehicleKilometers } from '../services/vehicles/kilometers';
import { VehicleKilometersLog } from '../interfaces/vehicleKilometers';

export class VehicleKilometersController {
  // GET: list logs for a vehicle
  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id; // parent param from /vehicles/:id/kilometers
    const logs = await getVehicleKilometers(vehicleId);
    res.status(200).json({ status: 'success', data: logs });
  });

  // POST: add new log
  create = asyncHandler(async (req: Request, res: Response) => {
  const vehicleId = req.params.id; // enforce vehicleId from path
  const parsedBody = VehicleKilometersLogCreateSchema.parse(req.body);
  const parsed: VehicleKilometersLog = { ...parsedBody, vehicleId } as VehicleKilometersLog;

    const inserted = await addVehicleKilometers(parsed);

    res.status(201).json({ status: 'success', data: inserted, message: 'Kilometers log created successfully' });
  });
}

export const vehicleKilometersController = new VehicleKilometersController();
