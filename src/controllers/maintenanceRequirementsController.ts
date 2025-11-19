import { Request, Response } from "express";
import { asyncHandler, AppError } from "@/middleware/errorHandler";
import {
  MaintenanceRequirementSchema,
  UpdateMaintenanceRequirementSchema,
} from "@/schemas/maintenanceRequirement";
import type { MaintenanceRequirement } from "@/schemas/maintenanceRequirement";
import {
  MaintenanceRequirementsService,
  MaintenanceRequirementDTO,
} from "@/services/maintenanceRequirementsService";
import { ApiResponse } from "@/controllers/baseController";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceRequirementFilters } from "@/repositories/interfaces/IMaintenanceRequirementRepository";
import {
  parsePaginationQuery,
  extractFilters,
  extractSearch,
} from "@/utils/index";

export class MaintenanceRequirementsController {
  constructor(private readonly service: MaintenanceRequirementsService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const search = extractSearch(req.query);
    const filters = extractFilters<MaintenanceRequirementFilters>(req.query);

    const options: RepositoryFindOptions<MaintenanceRequirementFilters> = {
      pagination: { limit, offset },
      filters,
      search,
    };

    const { items, total } = await this.service.getAll(options);

    const response: ApiResponse<MaintenanceRequirementDTO[]> = {
      status: "success",
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    res.status(200).json(response);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.maintenanceRequirementId;

    const maintenanceRequirement = await this.service.getById(id);

    if (!maintenanceRequirement) {
      const response: ApiResponse<null> = {
        status: "error",
        message: `Maintenance requirement with ID ${id} was not found`,
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<MaintenanceRequirementDTO> = {
      status: "success",
      data: maintenanceRequirement,
    };

    res.status(200).json(response);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const maintenanceRequirement: MaintenanceRequirement =
      MaintenanceRequirementSchema.parse(req.body);

    try {
      const result = await this.service.create(maintenanceRequirement);

      const response: ApiResponse<typeof result> = {
        status: "success",
        data: result,
        message: "Maintenance requirement created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
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
    const updateData = UpdateMaintenanceRequirementSchema.parse(req.body);

    try {
      const result = await this.service.update(id, updateData);
      if (!result) {
        const response: ApiResponse<null> = {
          status: "error",
          message: `Maintenance requirement with ID ${id} was not found`,
        };
        res.status(404).json(response);
        return;
      }
      const response: ApiResponse<typeof result> = {
        status: "success",
        data: result,
        message: "Maintenance requirement updated successfully",
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
        message: `Maintenance requirement with ID ${id} was not found`,
      };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<null> = {
      status: "success",
      data: null,
      message: "Maintenance requirement deleted successfully",
    };
    res.status(200).json(response);
  });
}

export const createMaintenanceRequirementsController = (
  service?: MaintenanceRequirementsService,
) => {
  const svc =
    service ??
    new ServiceFactory(AppDataSource).createMaintenanceRequirementsService();
  return new MaintenanceRequirementsController(svc);
};

export const maintenanceRequirementsController =
  createMaintenanceRequirementsController();
