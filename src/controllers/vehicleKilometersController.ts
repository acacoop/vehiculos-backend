import { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import {
  VehicleKilometersLogCreateSchema,
  VehicleKilometersLogUpdateSchema,
} from "@/schemas/vehicleKilometers";
import type {
  VehicleKilometersLog,
  VehicleKilometersLogUpdate,
} from "@/schemas/vehicleKilometers";
import {
  VehicleKilometersService,
  createVehicleKilometersService,
} from "@/services/vehicleKilometersService";
import { BaseController } from "@/controllers/baseController";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { VehicleKilometersFilters } from "@/repositories/interfaces/IVehicleKilometersRepository";

export class VehicleKilometersController extends BaseController<VehicleKilometersFilters> {
  constructor(private readonly service: VehicleKilometersService) {
    super({
      resourceName: "VehicleKilometersLog",
      allowedFilters: ["vehicleId", "userId", "startDate", "endDate"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<VehicleKilometersFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const parsedBody = VehicleKilometersLogCreateSchema.parse(data);
    return await this.service.create(parsedBody as VehicleKilometersLog);
  }

  protected async updateService(id: string, data: unknown) {
    const parsedBody = VehicleKilometersLogUpdateSchema.parse(data);
    return await this.service.update(
      id,
      parsedBody as VehicleKilometersLogUpdate,
    );
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }

  // Legacy endpoint for backwards compatibility - GET /vehicles/:id/kilometers
  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id;
    const logs = await this.service.getByVehicle(vehicleId);
    res.status(200).json({ status: "success", data: logs });
  });

  // Legacy endpoint for backwards compatibility - POST /vehicles/:id/kilometers
  createForVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.id;
    const parsedBody = VehicleKilometersLogCreateSchema.omit({
      vehicleId: true,
    }).parse(req.body);
    const parsed: VehicleKilometersLog = {
      ...parsedBody,
      vehicleId,
    } as VehicleKilometersLog;

    const inserted = await this.service.create(parsed);

    res.status(201).json({
      status: "success",
      data: inserted,
      message: "Kilometers log created successfully",
    });
  });
}

export function createVehicleKilometersController() {
  return new VehicleKilometersController(createVehicleKilometersService());
}
