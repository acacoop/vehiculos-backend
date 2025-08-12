import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { VehicleKilometersLogSchema } from '../schemas/vehicleKilometers';
import { getVehicleKilometers, addVehicleKilometers } from '../services/vehicles/kilometers';
import { VehicleKilometersLog } from '../interfaces/vehicleKilometers';

export class VehicleKilometersController {
  // GET: list logs for a vehicle
  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    const logs = await getVehicleKilometers(vehicleId);
    res.status(200).json({ status: 'success', data: logs });
  });

  // POST: add new log
  create = asyncHandler(async (req: Request, res: Response) => {
    const parsed: VehicleKilometersLog = VehicleKilometersLogSchema.parse(req.body);

    const inserted = await addVehicleKilometers(parsed);

    res.status(201).json({ status: 'success', data: inserted, message: 'Kilometers log created successfully' });
  });
}

export const vehicleKilometersController = new VehicleKilometersController();
