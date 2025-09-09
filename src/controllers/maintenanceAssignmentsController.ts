import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import {
  AssignedMaintenanceSchema,
  UpdateAssignedMaintenanceSchema,
} from "../schemas/maintenance/assignMaintance";
import type { AssignedMaintenance } from "../schemas/maintenance/assignMaintance";
import { AssignedMaintenancesService } from "../services/maintenancesService";
import { ApiResponse } from "./baseController";

export class MaintenanceAssignmentsController {
  constructor(private readonly service: AssignedMaintenancesService) {}
  // GET: Fetch all maintenance assignments for a specific vehicle
  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;

    const maintenanceRecords = await this.service.getByVehicle(vehicleId);

    const response: ApiResponse<AssignedMaintenance[]> = {
      status: "success",
      data: maintenanceRecords,
    };

    res.status(200).json(response);
  });

  // POST: Associate a maintenance with a vehicle
  create = asyncHandler(async (req: Request, res: Response) => {
    const assignedMaintenance: AssignedMaintenance =
      AssignedMaintenanceSchema.parse(req.body);

    try {
      const result = await this.service.create(assignedMaintenance);

      if (!result) {
        const response: ApiResponse<null> = {
          status: "error",
          message: "Failed to create maintenance assignment",
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse<typeof result> = {
        status: "success",
        data: result,
        message: "Maintenance assignment created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      // Handle validation errors from service
      if (error instanceof Error && error.message.includes("does not exist")) {
        const response: ApiResponse<null> = {
          status: "error",
          message: error.message,
        };
        res.status(404).json(response);
        return;
      }
      // Re-throw other errors to be handled by global error handler
      throw error;
    }
  });

  // PUT: Update a maintenance assignment
  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = UpdateAssignedMaintenanceSchema.parse(req.body);

    try {
      const result = await this.service.update(id, updateData);
      if (!result) {
        const response: ApiResponse<null> = {
          status: "error",
          message: `Maintenance assignment with ID ${id} was not found`,
        };
        res.status(404).json(response);
        return;
      }
      const response: ApiResponse<typeof result> = {
        status: "success",
        data: result,
        message: "Maintenance assignment updated successfully",
      };
      res.status(200).json(response);
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

  // DELETE: Remove a maintenance assignment
  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const success = await this.service.delete(id);
    if (!success) {
      const response: ApiResponse<null> = {
        status: "error",
        message: `Maintenance assignment with ID ${id} was not found`,
      };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<null> = {
      status: "success",
      data: null,
      message: "Maintenance assignment deleted successfully",
    };
    res.status(200).json(response);
  });
}

export function createMaintenanceAssignmentsController() {
  const service = new AssignedMaintenancesService();
  return new MaintenanceAssignmentsController(service);
}

export const maintenanceAssignmentsController =
  createMaintenanceAssignmentsController();
