import { BaseController } from "./baseController";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import type { Reservation } from "../schemas/reservation";
import {
  ReservationsService,
  createReservationsService,
} from "../services/reservationsService";
import { Request, Response } from "express";
import { ReservationSchema } from "../schemas/reservation";

export class ReservationsController extends BaseController {
  constructor(private readonly service: ReservationsService) {
    super("Reservation");
  }
  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    return this.service.getAll(options);
  }
  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }
  protected async createService(data: unknown) {
    const parsed = ReservationSchema.parse(data) as Reservation;
    return this.service.create(parsed);
  }
  protected async updateService(): Promise<unknown | null> {
    throw new AppError(
      "Update not supported. Use PATCH if needed.",
      405,
      "https://example.com/problems/method-not-allowed",
      "Method Not Allowed",
    );
  }
  protected async patchService(): Promise<unknown | null> {
    throw new AppError(
      "Patch not supported for reservations.",
      405,
      "https://example.com/problems/method-not-allowed",
      "Method Not Allowed",
    );
  }
  protected async deleteService(): Promise<boolean> {
    throw new AppError(
      "Delete not supported for reservations.",
      405,
      "https://example.com/problems/method-not-allowed",
      "Method Not Allowed",
    );
  }

  public getByUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await this.service.getByUserId(id);
    this.sendResponse(res, data, "Reservations by user");
  });
  public getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await this.service.getByVehicleId(id);
    this.sendResponse(res, data, "Reservations by vehicle");
  });
  public getAssignedVehicles = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const data = await this.service.getAssignedVehiclesReservations(id);
      this.sendResponse(res, data, "Reservations of assigned vehicles");
    },
  );
  public getTodayByUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await this.service.getTodayByUserId(id);
    this.sendResponse(res, data, "Today reservations by user");
  });
}

export function createReservationsController() {
  return new ReservationsController(createReservationsService());
}
