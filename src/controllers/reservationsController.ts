import { BaseController } from "@/controllers/baseController";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import type { Reservation } from "@/schemas/reservation";
import { ReservationsService } from "@/services/reservationsService";
import { Request, Response } from "express";
import { ReservationSchema } from "@/schemas/reservation";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { ReservationFilters } from "@/repositories/interfaces/IReservationRepository";

export class ReservationsController extends BaseController<ReservationFilters> {
  constructor(private readonly service: ReservationsService) {
    super({
      resourceName: "Reservation",
      allowedFilters: ["userId", "vehicleId"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<ReservationFilters>>,
  ) {
    return this.service.getAll(options);
  }
  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }
  protected async createService(data: unknown) {
    const parsed = ReservationSchema.parse(data) as Reservation;
    return this.service.create(parsed);
  }
  protected async updateService(
    id: string,
    data: unknown,
  ): Promise<unknown | null> {
    const parsed = ReservationSchema.partial().parse(
      data,
    ) as Partial<Reservation>;
    return this.service.update(id, parsed);
  }
  protected async deleteService(id: string): Promise<boolean> {
    return this.service.delete(id);
  }

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await this.getByIdService(id);
    if (!data) {
      throw new AppError(
        "Reservation not found",
        404,
        "https://example.com/problems/not-found",
        "Not Found",
      );
    }
    this.sendResponse(res, data, "Reservation found");
  });

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

export function createReservationsController(
  service?: ReservationsService,
): ReservationsController {
  const svc =
    service ?? new ServiceFactory(AppDataSource).createReservationsService();
  return new ReservationsController(svc);
}
