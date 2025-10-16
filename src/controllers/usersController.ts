import { BaseController } from "./baseController";
import type { User } from "../schemas/user";
import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { UsersService } from "../services/usersService";

export class UsersController extends BaseController {
  constructor(private readonly service: UsersService) {
    super("User");
  }

  // Implement abstract methods from BaseController
  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    return await this.service.getAll({
      pagination: { limit: options.limit, offset: options.offset },
      searchParams: options.searchParams,
    });
  }

  protected async getByIdService(id: string) {
    return await this.service.getById(id);
  }

  protected async createService(data: unknown) {
    return await this.service.create(data as User);
  }

  protected async updateService(id: string, data: Partial<User>) {
    return await this.service.update(id, data);
  }

  protected async patchService(id: string, data: Partial<User>) {
    // Para PATCH, usamos la misma lógica que update ya que ambos aceptan datos parciales
    return await this.service.update(id, data);
  }

  protected async deleteService(id: string) {
    return await this.service.delete(id);
  }

  // Custom endpoints following BaseController pattern
  public activate = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const result = await this.service.activate(id);

      if (!result) {
        throw new AppError(
          `${this.resourceName} with ID ${id} was not found`,
          404,
          "https://example.com/problems/resource-not-found",
          "Resource Not Found",
        );
      }

      this.sendResponse(
        res,
        result,
        `${this.resourceName} activated successfully`,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_ACTIVE") {
        throw new AppError(
          "User is already active",
          409,
          "https://example.com/problems/invalid-state-transition",
          "Invalid State Transition",
        );
      }
      throw error;
    }
  });

  public deactivate = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const result = await this.service.deactivate(id);

      if (!result) {
        throw new AppError(
          `${this.resourceName} with ID ${id} was not found`,
          404,
          "https://example.com/problems/resource-not-found",
          "Resource Not Found",
        );
      }

      this.sendResponse(
        res,
        result,
        `${this.resourceName} deactivated successfully`,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_INACTIVE") {
        throw new AppError(
          "User is already inactive",
          409,
          "https://example.com/problems/invalid-state-transition",
          "Invalid State Transition",
        );
      }
      throw error;
    }
  });
}

// Factory function is no longer needed here - will be created in routes
// Controllers should receive their dependencies
