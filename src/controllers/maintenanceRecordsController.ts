import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { MaintenanceRecordSchema } from "../schemas/maintenance/maintanceRecord";
import { MaintenanceRecordsService } from "../services/maintenancesService";
import type { MaintenanceRecord } from "../schemas/maintenance/maintanceRecord";
import { ApiResponse } from "./baseController";

export class MaintenanceRecordsController {
  constructor(private readonly service: MaintenanceRecordsService) {}
  // GET: Fetch all maintenance records with pagination and filtering
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Extract filtering parameters
    const filters: Record<string, string> = {};
    const allowedFilters = [
      "vehicleId",
      "maintenanceId",
      "userId",
      "assignedMaintenanceId",
    ];

    for (const [key, value] of Object.entries(req.query)) {
      if (allowedFilters.includes(key) && typeof value === "string") {
        filters[key] = value;
      }
    }

    const { items, total } = await this.service.getAll({
      limit,
      offset,
      filters,
    });

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
      req.body
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
          "Validation Error"
        );
      }
      throw error;
    }
  });
}
export function createMaintenanceRecordsController() {
  const service = new MaintenanceRecordsService();
  return new MaintenanceRecordsController(service);
}

export const maintenanceRecordsController =
  createMaintenanceRecordsController();
