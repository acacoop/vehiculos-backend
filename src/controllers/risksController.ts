import { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { RisksService } from "@/services/risksService";
import { RisksRepository } from "@/repositories/RisksRepository";
import { AppDataSource } from "@/db";
import { parsePaginationQuery } from "@/utils/index";
import {
  RisksSummaryFiltersSchema,
  VehiclesWithoutResponsibleFiltersSchema,
  OverdueMaintenanceFiltersSchema,
  OverdueQuarterlyControlsFiltersSchema,
  QuarterlyControlsWithErrorsFiltersSchema,
  VehiclesWithoutRecentKilometersFiltersSchema,
} from "@/schemas/risks";

export class RisksController {
  constructor(private readonly service: RisksService) {}

  private sendResponse<T>(
    res: Response,
    data: T,
    statusCode = 200,
    pagination?: { page: number; limit: number; total: number; pages: number },
  ) {
    res.status(statusCode).json({
      status: "success" as const,
      data,
      pagination,
    });
  }

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const filters = RisksSummaryFiltersSchema.parse(req.query);
    const result = await this.service.getSummary(filters);
    this.sendResponse(res, result);
  });

  getVehiclesWithoutResponsible = asyncHandler(
    async (req: Request, res: Response) => {
      const { page, limit, offset } = parsePaginationQuery(req.query);
      const filters = VehiclesWithoutResponsibleFiltersSchema.parse(req.query);
      const { items, total } = await this.service.getVehiclesWithoutResponsible(
        { ...filters, limit, offset },
      );
      this.sendResponse(res, items, 200, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    },
  );

  getOverdueMaintenanceVehicles = asyncHandler(
    async (req: Request, res: Response) => {
      const { page, limit, offset } = parsePaginationQuery(req.query);
      const filters = OverdueMaintenanceFiltersSchema.parse(req.query);
      const { items, total } = await this.service.getOverdueMaintenanceVehicles(
        {
          ...filters,
          limit,
          offset,
        },
      );
      this.sendResponse(res, items, 200, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    },
  );

  getOverdueQuarterlyControls = asyncHandler(
    async (req: Request, res: Response) => {
      const { page, limit, offset } = parsePaginationQuery(req.query);
      const filters = OverdueQuarterlyControlsFiltersSchema.parse(req.query);
      const { items, total } = await this.service.getOverdueQuarterlyControls({
        ...filters,
        limit,
        offset,
      });
      this.sendResponse(res, items, 200, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    },
  );

  getQuarterlyControlsWithErrors = asyncHandler(
    async (req: Request, res: Response) => {
      const { page, limit, offset } = parsePaginationQuery(req.query);
      const filters = QuarterlyControlsWithErrorsFiltersSchema.parse(req.query);
      const { items, total } =
        await this.service.getQuarterlyControlsWithErrors({
          ...filters,
          limit,
          offset,
        });
      this.sendResponse(res, items, 200, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    },
  );

  getVehiclesWithoutRecentKilometers = asyncHandler(
    async (req: Request, res: Response) => {
      const { page, limit, offset } = parsePaginationQuery(req.query);
      const filters = VehiclesWithoutRecentKilometersFiltersSchema.parse(
        req.query,
      );
      const { items, total } =
        await this.service.getVehiclesWithoutRecentKilometers({
          ...filters,
          limit,
          offset,
        });
      this.sendResponse(res, items, 200, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    },
  );
}

export const createRisksController = () => {
  const riskRepo = new RisksRepository(AppDataSource);
  const riskService = new RisksService(riskRepo);
  return new RisksController(riskService);
};
