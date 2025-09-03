import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { VehicleKilometersLogCreateSchema } from "../schemas/vehicleKilometers";
import type { VehicleKilometersLog } from "../schemas/vehicleKilometers";
import {
  VehicleKilometersService,
  createVehicleKilometersService,
} from "../services/vehicles/kilometers";

export class VehicleKilometersController {
  constructor(private readonly service: VehicleKilometersService) {}
  // GET: list logs for a vehicle
  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id; // parent param from /vehicles/:id/kilometers
    const logs = await this.service.getByVehicle(vehicleId);
    res.status(200).json({ status: "success", data: logs });
  });

  // POST: add new log
  create = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id; // enforce vehicleId from path
    const parsedBody = VehicleKilometersLogCreateSchema.parse(req.body);
    const parsed: VehicleKilometersLog = {
      ...parsedBody,
      vehicleId,
    } as VehicleKilometersLog;

    const inserted = await this.service.create(parsed);

    res
      .status(201)
      .json({
        status: "success",
        data: inserted,
        message: "Kilometers log created successfully",
      });
  });
}

export function createVehicleKilometersController() {
  return new VehicleKilometersController(createVehicleKilometersService());
}
