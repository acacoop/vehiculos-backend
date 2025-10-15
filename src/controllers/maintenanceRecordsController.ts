import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { MaintenanceRecordSchema } from "../schemas/maintenanceRecord";
import { MaintenanceRecordsService } from "../services/maintenancesService";
import type { MaintenanceRecord } from "../schemas/maintenanceRecord";
import { ApiResponse } from "./baseController";
import { ServiceFactory } from "../factories/serviceFactory";
import { AppDataSource } from "../db";
import { PermissionFilterRequest } from "../middleware/permissionFilter";
import { RepositoryFindOptions } from "../repositories/interfaces/common";
import { MaintenanceRecordSearchParams } from "../repositories/interfaces/IMaintenanceRecordRepository";
import { parsePaginationQuery } from "../utils/common";

export class MaintenanceRecordsController {
  constructor(private readonly service: MaintenanceRecordsService) {}
  // GET: Fetch all maintenance records with pagination and filtering
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const permReq = req as PermissionFilterRequest;
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract filtering parameters
    const searchParams: MaintenanceRecordSearchParams = {};
    const allowedFilters: Array<keyof MaintenanceRecordSearchParams> = [
      "vehicleId",
      "maintenanceId",
      "userId",
      "assignedMaintenanceId",
    ];

    for (const [key, value] of Object.entries(req.query)) {
      if (
        allowedFilters.includes(key as keyof MaintenanceRecordSearchParams) &&
        typeof value === "string"
      ) {
        searchParams[key as keyof MaintenanceRecordSearchParams] = value;
      }
    }

    const options: RepositoryFindOptions<MaintenanceRecordSearchParams> = {
      pagination: { limit, offset },
      searchParams,
      permissions: permReq.permissionFilter, // Populated by middleware
    };

    const { items, total } = await this.service.getAll(options);

    const totalPages = Math.ceil(total / limit);

    const response: ApiResponse<MaintenanceRecord[]> = {
      status: "success",
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
    };

    res.status(200).json(response);
  });

  // GET: Fetch a specific maintenance record by ID
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const record = await this.service.getById(id);

    if (!record) {
      res.status(404).json({
        status: "error",
        message: "Maintenance record not found",
      });
      return;
    }

    const response: ApiResponse<MaintenanceRecord> = {
      status: "success",
      data: record,
    };

    res.status(200).json(response);
  });

  // POST: Create a new maintenance record
  create = asyncHandler(async (req: Request, res: Response) => {
    const maintenanceRecord: MaintenanceRecord = MaintenanceRecordSchema.parse(
      req.body,
    );

    try {
      const newRecord = await this.service.create(maintenanceRecord);

      const response: ApiResponse<typeof newRecord> = {
        status: "success",
        data: newRecord,
        message: "Maintenance record created successfully",
      };
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error) {
        throw new AppError(
          error.message,
          400,
          "https://example.com/problems/validation-error",
          "Validation Error",
        );
      }
      throw error;
    }
  });
}
export function createMaintenanceRecordsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createMaintenanceRecordsService();
  return new MaintenanceRecordsController(service);
}

export const maintenanceRecordsController =
  createMaintenanceRecordsController();
