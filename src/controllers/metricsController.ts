import { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { MetricsService } from "@/services/metricsService";
import { MetricsRepository } from "@/repositories/MetricsRepository";
import { AppDataSource } from "@/db";
import {
  KilometersMetricsQuerySchema,
  AgeMetricsQuerySchema,
  TimelineMetricsQuerySchema,
  QuarterlyControlMetricsQuerySchema,
  DistributionMetricsQuerySchema,
} from "@/schemas/metrics";

export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  private sendResponse<T>(res: Response, data: T, statusCode = 200) {
    res.status(statusCode).json({
      status: "success" as const,
      data,
    });
  }

  // ============================================
  // Vehicle Metrics
  // ============================================

  /**
   * GET /metrics/vehicles/count
   * Returns total vehicle count
   */
  getVehicleCount = asyncHandler(async (_req: Request, res: Response) => {
    const result = await this.service.getVehicleCount();
    this.sendResponse(res, result);
  });

  /**
   * GET /metrics/vehicles/kilometers
   * Returns vehicles by kilometer buckets
   */
  getVehiclesByKilometers = asyncHandler(
    async (req: Request, res: Response) => {
      const query = KilometersMetricsQuerySchema.parse(req.query);
      const result = await this.service.getVehiclesByKilometers(query);
      this.sendResponse(res, result);
    },
  );

  /**
   * GET /metrics/vehicles/age
   * Returns vehicles by age buckets
   */
  getVehiclesByAge = asyncHandler(async (req: Request, res: Response) => {
    const query = AgeMetricsQuerySchema.parse(req.query);
    const result = await this.service.getVehiclesByAge(query);
    this.sendResponse(res, result);
  });

  /**
   * GET /metrics/vehicles/fuel-type
   * Returns vehicles by fuel type distribution
   */
  getVehiclesByFuelType = asyncHandler(async (req: Request, res: Response) => {
    const query = DistributionMetricsQuerySchema.parse(req.query);
    const result = await this.service.getVehiclesByFuelType(query.limit);
    this.sendResponse(res, result);
  });

  /**
   * GET /metrics/vehicles/brand
   * Returns vehicles by brand distribution
   */
  getVehiclesByBrand = asyncHandler(async (req: Request, res: Response) => {
    const query = DistributionMetricsQuerySchema.parse(req.query);
    const result = await this.service.getVehiclesByBrand(query.limit);
    this.sendResponse(res, result);
  });

  // ============================================
  // Management Metrics
  // ============================================

  /**
   * GET /metrics/reservations
   * Returns reservations timeline by month
   */
  getReservationsTimeline = asyncHandler(
    async (req: Request, res: Response) => {
      const query = TimelineMetricsQuerySchema.parse(req.query);
      const result = await this.service.getReservationsTimeline(query);
      this.sendResponse(res, result);
    },
  );

  /**
   * GET /metrics/maintenance-records
   * Returns maintenance records timeline by month
   */
  getMaintenanceRecordsTimeline = asyncHandler(
    async (req: Request, res: Response) => {
      const query = TimelineMetricsQuerySchema.parse(req.query);
      const result = await this.service.getMaintenanceRecordsTimeline(query);
      this.sendResponse(res, result);
    },
  );

  // ============================================
  // Quarterly Control Metrics
  // ============================================

  /**
   * GET /metrics/quarterly-controls
   * Returns quarterly controls by status
   */
  getQuarterlyControlsStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const query = QuarterlyControlMetricsQuerySchema.parse(req.query);
      const result = await this.service.getQuarterlyControlsStatus(query);
      this.sendResponse(res, result);
    },
  );

  // ============================================
  // Personnel Metrics
  // ============================================

  /**
   * GET /metrics/drivers
   * Returns assigned drivers metrics
   */
  getDriversMetrics = asyncHandler(async (req: Request, res: Response) => {
    const query = TimelineMetricsQuerySchema.parse(req.query);
    const result = await this.service.getDriversMetrics(query);
    this.sendResponse(res, result);
  });

  /**
   * GET /metrics/responsibles
   * Returns assigned responsibles metrics
   */
  getResponsiblesMetrics = asyncHandler(async (req: Request, res: Response) => {
    const query = TimelineMetricsQuerySchema.parse(req.query);
    const result = await this.service.getResponsiblesMetrics(query);
    this.sendResponse(res, result);
  });
}

// Factory helper
export const createMetricsController = () => {
  const metricsRepo = new MetricsRepository(AppDataSource);
  const metricsService = new MetricsService(metricsRepo);
  return new MetricsController(metricsService);
};
