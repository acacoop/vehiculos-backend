import { BaseController } from "@/controllers/baseController";
import type { User } from "@/schemas/user";
import { Request, Response } from "express";
import { asyncHandler, AppError } from "@/middleware/errorHandler";
import { UsersService } from "@/services/usersService";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { UserFilters } from "@/repositories/interfaces/IUserRepository";

export class UsersController extends BaseController<UserFilters> {
  constructor(private readonly service: UsersService) {
    super({
      resourceName: "User",
      allowedFilters: ["email", "cuit", "firstName", "lastName", "active"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<UserFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return await this.service.getById(id);
  }

  protected async createService(data: unknown) {
    return await this.service.create(data as User);
  }

  protected async updateService(
    id: string,
    data: Partial<User>,
    _req: Request,
  ) {
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
