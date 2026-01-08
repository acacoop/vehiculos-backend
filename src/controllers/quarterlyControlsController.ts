import { BaseController } from "@/controllers/baseController";
import { AppError } from "@/middleware/errorHandler";
import { QuarterlyControlSchema } from "@/schemas/quarterlyControl";
import { QuarterlyControlsService } from "@/services/quarterlyControlsService";
import type { QuarterlyControl } from "@/schemas/quarterlyControl";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { QuarterlyControlFilters } from "@/repositories/interfaces/IQuarterlyControlRepository";
import { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { AuthenticatedRequest } from "@/middleware/auth";
import { z } from "zod";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

const MAX_YEAR = new Date().getFullYear() + 5;

const CreateControlWithItemsSchema = z.object({
  vehicleId: z.string().uuid(),
  year: z.number().int().min(2000).max(MAX_YEAR),
  quarter: z.number().int().min(1).max(4),
  intendedDeliveryDate: z.string(),
  items: z.array(
    z.object({
      title: z.string(),
      status: z.nativeEnum(QuarterlyControlItemStatus),
      observations: z.string(),
    }),
  ),
});

const PatchControlWithItemsSchema = z.object({
  kilometers: z.number().nonnegative(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.nativeEnum(QuarterlyControlItemStatus),
      observations: z.string(),
    }),
  ),
});

export class QuarterlyControlsController extends BaseController<QuarterlyControlFilters> {
  constructor(private readonly service: QuarterlyControlsService) {
    super({
      resourceName: "QuarterlyControl",
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
    options: RepositoryFindOptions<Partial<QuarterlyControlFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const quarterlyControl = QuarterlyControlSchema.parse(data);
    try {
      return await this.service.create(quarterlyControl as QuarterlyControl);
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

  protected async updateService(id: string, data: unknown, _req: Request) {
    const parsed = QuarterlyControlSchema.partial().parse(data);
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

  // Create control with items (admin only)
  public createWithItems = asyncHandler(async (req: Request, res: Response) => {
    const data = CreateControlWithItemsSchema.parse(req.body);
    try {
      const result = await this.service.createWithItems(data);
      this.sendResponse(
        res,
        result,
        "Control with items created successfully",
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
  });

  // Patch control with items
  public patchWithItems = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = PatchControlWithItemsSchema.parse(req.body);
    const { user } = req as AuthenticatedRequest;
    const userId = user?.id;
    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );
    }
    try {
      const result = await this.service.patchWithItems(id, data, userId);
      if (!result) {
        throw new AppError(
          "Control not found",
          404,
          "https://example.com/problems/not-found",
          "Not Found",
        );
      }
      this.sendResponse(
        res,
        result,
        "Control with items updated successfully",
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
  });
}

export function createQuarterlyControlsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createQuarterlyControlsService();
  return new QuarterlyControlsController(service);
}

export const quarterlyControlsController = createQuarterlyControlsController();
