import { BaseController } from "./baseController";
import { Maintenance } from "../interfaces/maintenance";
import {
  getAllMaintenances,
  getMaintenanceById,
  getMaintenanceWithDetailsById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "../services/vehicles/maintenance/posibles";
import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";

export class MaintenancePosiblesController extends BaseController {
  constructor() {
    super("Maintenance");
  }

  // Implement abstract methods from BaseController
  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    // Maintenance posibles don't typically need pagination, but we'll adapt the response
    const maintenances = await getAllMaintenances();
    return { items: maintenances, total: maintenances.length };
  }

  protected async getByIdService(id: string) {
    // Return maintenance with details (includes category name)
    const maintenance = await getMaintenanceWithDetailsById(id);
    if (!maintenance) {
      return null;
    }
    return maintenance;
  }

  protected async createService(data: unknown) {
    const maintenanceData = data as Omit<Maintenance, "id">;

    try {
      return await createMaintenance(maintenanceData);
    } catch (error) {
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
  }

  protected async updateService(id: string, data: unknown) {
    const maintenanceData = data as Partial<Maintenance>;

    try {
      return await updateMaintenance(id, maintenanceData);
    } catch (error) {
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
  }

  protected async patchService(id: string, data: unknown) {
    // For PATCH, use the same logic as update since both accept partial data
    const maintenanceData = data as Partial<Maintenance>;

    try {
      return await updateMaintenance(id, maintenanceData);
    } catch (error) {
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
  }

  protected async deleteService(id: string) {
    return await deleteMaintenance(id);
  }
}

export const maintenancePosiblesController =
  new MaintenancePosiblesController();
