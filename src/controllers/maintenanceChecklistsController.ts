import { BaseController } from "@/controllers/baseController";
import { AppError } from "@/middleware/errorHandler";
import { MaintenanceChecklistSchema } from "@/schemas/maintenanceChecklist";
import { MaintenanceChecklistsService } from "@/services/maintenanceChecklistsService";
import type { MaintenanceChecklist } from "@/schemas/maintenanceChecklist";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { MaintenanceChecklistFilters } from "@/repositories/interfaces/IMaintenanceChecklistRepository";
import { Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { AuthenticatedRequest } from "@/middleware/auth";
import { z } from "zod";
import { MaintenanceChecklistItemStatus } from "@/enums/MaintenanceChecklistItemStatusEnum";

const CreateChecklistWithItemsSchema = z.object({
  vehicleId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  quarter: z.number().int().min(1).max(4),
  intendedDeliveryDate: z.string(),
  items: z.array(
    z.object({
      title: z.string(),
      status: z.nativeEnum(MaintenanceChecklistItemStatus),
      observations: z.string(),
    }),
  ),
});

const PatchChecklistWithItemsSchema = z.object({
  kilometers: z.number().nonnegative(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.nativeEnum(MaintenanceChecklistItemStatus),
      observations: z.string(),
    }),
  ),
});

export class MaintenanceChecklistsController extends BaseController<MaintenanceChecklistFilters> {
  constructor(private readonly service: MaintenanceChecklistsService) {
    super({
      resourceName: "MaintenanceChecklist",
      allowedFilters: [
        "vehicleId",
        "year",
        "quarter",
        "filledBy",
        "hasFailedItems",
      ],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<MaintenanceChecklistFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const maintenanceChecklist = MaintenanceChecklistSchema.parse(data);
    try {
      return await this.service.create(
        maintenanceChecklist as MaintenanceChecklist,
      );
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
    const parsed = MaintenanceChecklistSchema.partial().parse(data);
    try {
      return await this.service.update(id, parsed);
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

  protected async deleteService(id: string): Promise<boolean> {
    return this.service.delete(id);
  }

  // Create checklist with items (admin only)
  public createWithItems = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const data = CreateChecklistWithItemsSchema.parse(req.body);
      try {
        const result = await this.service.createWithItems(data);
        this.sendResponse(
          res,
          result,
          "Checklist with items created successfully",
          201,
        );
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
    },
  );

  // Patch checklist with items
  public patchWithItems = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const data = PatchChecklistWithItemsSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          "User not authenticated",
          401,
          "https://example.com/problems/unauthorized",
          "Unauthorized",
        );
      }
      try {
        const result = await this.service.patchWithItems(id, {
          ...data,
          userId,
        });
        if (!result) {
          throw new AppError(
            "Checklist not found",
            404,
            "https://example.com/problems/not-found",
            "Not Found",
          );
        }
        this.sendResponse(
          res,
          result,
          "Checklist with items updated successfully",
          200,
        );
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
    },
  );
}

export function createMaintenanceChecklistsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createMaintenanceChecklistsService();
  return new MaintenanceChecklistsController(service);
}

export const maintenanceChecklistsController =
  createMaintenanceChecklistsController();
