import { BaseController } from "./baseController";
import {
  MaintenanceCreateSchema,
  MaintenanceUpdateSchema,
} from "../schemas/maintenance/maintenance";
import { MaintenancesService } from "../services/maintenancesService";
import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";

export class MaintenancePosiblesController extends BaseController {
  constructor(private readonly service: MaintenancesService) {
    super("Maintenance");
  }

  // Implement abstract methods from BaseController
  protected async getAllService(_options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    // Fetch all possible maintenances
    const maintenances = await this.service.getAll();
    return { items: maintenances, total: maintenances.length };
  }

  protected async getByIdService(id: string) {
    // Return maintenance with details (includes category name)
    const maintenance = await this.service.getWithDetails(id);
    if (!maintenance) {
      return null;
    }
    return maintenance;
  }

  protected async createService(data: unknown) {
    const maintenanceData = MaintenanceCreateSchema.parse(data);

    try {
      return await this.service.create(maintenanceData);
    } catch (error) {
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
  }

  protected async updateService(id: string, data: unknown) {
    const maintenanceData = MaintenanceUpdateSchema.parse(data);

    try {
      return await this.service.update(id, maintenanceData);
    } catch (error) {
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
  }

  protected async patchService(id: string, data: unknown) {
    // For PATCH, use the same logic as update since both accept partial data
    const maintenanceData = MaintenanceUpdateSchema.parse(data);

    try {
      return await this.service.update(id, maintenanceData);
    } catch (error) {
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
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }

  // Get all vehicles assigned to a specific maintenance
  public getVehiclesByMaintenance = asyncHandler(
    async (req: Request, res: Response) => {
      const maintenanceId = req.params.id;

      try {
        // First verify that the maintenance exists
        const maintenance = await this.service.getById(maintenanceId);
        if (!maintenance) {
          throw new AppError(
            `Maintenance with ID ${maintenanceId} not found`,
            404,
            "https://example.com/problems/maintenance-not-found",
            "Maintenance Not Found",
          );
        }

        const vehicles = await this.service.getVehicles(maintenanceId);

        res.status(200).json({
          status: "success",
          data: vehicles,
          message:
            vehicles.length > 0
              ? `Found ${vehicles.length} vehicle(s) assigned to maintenance`
              : "No vehicles assigned to this maintenance",
        });
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(
          "Failed to retrieve vehicles for maintenance",
          500,
          "https://example.com/problems/database-error",
          "Database Error",
        );
      }
    },
  );
}

export function createMaintenancePosiblesController() {
  const service = new MaintenancesService();
  return new MaintenancePosiblesController(service);
}

export const maintenancePosiblesController =
  createMaintenancePosiblesController();
