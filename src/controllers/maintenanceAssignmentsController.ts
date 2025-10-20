import { Request, Response } from "express";
import { asyncHandler, AppError } from "middleware/errorHandler";
import {
  AssignedMaintenanceSchema,
  UpdateAssignedMaintenanceSchema,
} from "schemas/assignMaintance";
import type { AssignedMaintenance } from "schemas/assignMaintance";
import { AssignedMaintenancesService } from "services/maintenancesService";
import { ApiResponse } from "./baseController";
import { ServiceFactory } from "factories/serviceFactory";
import { AppDataSource } from "db";

export class MaintenanceAssignmentsController {
  constructor(private readonly service: AssignedMaintenancesService) {}

  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;

    const maintenanceRecords = await this.service.getByVehicle(vehicleId);

    const response: ApiResponse<AssignedMaintenance[]> = {
      status: "success",
      data: maintenanceRecords,
    };

    res.status(200).json(response);
  });

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
      if (error instanceof Error && error.message.includes("does not exist")) {
        const response: ApiResponse<null> = {
          status: "error",
          message: error.message,
        };
        res.status(404).json(response);
        return;
      }
      throw error;
    }
  });

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

export const createMaintenanceAssignmentsController = (
  service?: AssignedMaintenancesService,
) => {
  const svc =
    service ??
    new ServiceFactory(AppDataSource).createAssignedMaintenancesService();
  return new MaintenanceAssignmentsController(svc);
};

export const maintenanceAssignmentsController =
  createMaintenanceAssignmentsController();
