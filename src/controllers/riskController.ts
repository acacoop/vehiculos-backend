import { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { RiskService } from "@/services/riskService";
import { RiskRepository } from "@/repositories/RiskRepository";
import { AppDataSource } from "@/db";

export class RiskController {
  constructor(private readonly service: RiskService) {}

  private sendResponse<T>(res: Response, data: T, statusCode = 200) {
    res.status(statusCode).json({
      status: "success" as const,
      data,
    });
  }

  getSummary = asyncHandler(async (_req: Request, res: Response) => {
    const result = await this.service.getSummary();
    this.sendResponse(res, result);
  });

  getVehiclesWithoutResponsible = asyncHandler(
    async (_req: Request, res: Response) => {
      const result = await this.service.getVehiclesWithoutResponsible();
      this.sendResponse(res, result);
    },
  );

  getOverdueMaintenance = asyncHandler(async (_req: Request, res: Response) => {
    const result = await this.service.getOverdueMaintenance();
    this.sendResponse(res, result);
  });

  getOverdueQuarterlyControls = asyncHandler(
    async (_req: Request, res: Response) => {
      const result = await this.service.getOverdueQuarterlyControls();
      this.sendResponse(res, result);
    },
  );

  getQuarterlyControlsWithErrors = asyncHandler(
    async (_req: Request, res: Response) => {
      const result = await this.service.getQuarterlyControlsWithErrors();
      this.sendResponse(res, result);
    },
  );
}

export const createRiskController = () => {
  const riskRepo = new RiskRepository(AppDataSource);
  const riskService = new RiskService(riskRepo);
  return new RiskController(riskService);
};
