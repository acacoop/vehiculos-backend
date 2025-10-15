import { BaseController } from "./baseController";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import type { Reservation } from "../schemas/reservation";
import { ReservationsService } from "../services/reservationsService";
import { Request, Response } from "express";
import { ReservationSchema } from "../schemas/reservation";
import { ServiceFactory } from "../factories/serviceFactory";
import { AppDataSource } from "../db";
import { PermissionFilterRequest } from "../middleware/permissionFilter";
import { RepositoryFindOptions } from "../repositories/interfaces/common";
import { ReservationSearchParams } from "../repositories/interfaces/IReservationRepository";
import { parsePaginationQuery } from "../utils/common";

export class ReservationsController extends BaseController {
  constructor(private readonly service: ReservationsService) {
    super("Reservation");
  }

  // Override getAll to use permission filter from middleware
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const permReq = req as PermissionFilterRequest;
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract search parameters (excluding pagination params)
    const searchParams: ReservationSearchParams = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== "page" && key !== "limit" && typeof value === "string") {
        searchParams[key as keyof ReservationSearchParams] = value;
      }
    }

    const options: RepositoryFindOptions<ReservationSearchParams> = {
      pagination: { limit, offset },
      searchParams,
      permissions: permReq.permissionFilter, // Populated by middleware
    };

    const { items, total } = await this.service.getAll(options);

    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    // This method is overridden by getAll() above
    // Kept for BaseController compatibility
    const { items, total } = await this.service.getAll({
      pagination: { limit: options.limit, offset: options.offset },
      searchParams: options.searchParams,
    });
    return { items, total };
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

export function createReservationsController(
  service?: ReservationsService,
): ReservationsController {
  const svc =
    service ?? new ServiceFactory(AppDataSource).createReservationsService();
  return new ReservationsController(svc);
}
