import { Request, Response } from "express";
import { BaseController } from "./baseController";
import { UserRolesService } from "../services/userRolesService";
import { asyncHandler } from "../middleware/errorHandler";
import {
  UserRoleInputSchema,
  UserRoleUpdateSchema,
  UserRoleEndSchema,
} from "../schemas/userRole";
import { UserRoleEnum } from "../utils/common";

export class UserRolesController extends BaseController {
  constructor(private readonly service: UserRolesService) {
    super("UserRole");
  }

  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    const { limit, offset, searchParams } = options;

    return this.service.getAll({
      limit,
      offset,
      userId: searchParams?.userId,
      role: searchParams?.role as UserRoleEnum,
      activeOnly: searchParams?.activeOnly === "true",
    });
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const parsed = UserRoleInputSchema.parse(data);
    return this.service.create(parsed);
  }

  protected async updateService(id: string, data: unknown) {
    const parsed = UserRoleUpdateSchema.parse(data);
    return this.service.update(id, parsed);
  }

  protected async patchService(id: string, data: unknown) {
    const parsed = UserRoleUpdateSchema.partial().parse(data);
    return this.service.update(id, parsed);
  }

  protected async deleteService(id: string) {
    return this.service.delete(id);
  }

  // Custom endpoints

  public getByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const data = await this.service.getByUserId(userId);
    this.sendResponse(res, data, "User roles retrieved successfully");
  });

  public getActiveByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const data = await this.service.getActiveByUserId(userId);
    this.sendResponse(res, data, "Active user role retrieved successfully");
  });

  public endRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const parsed = UserRoleEndSchema.parse(req.body);
    const data = await this.service.endRole(id, parsed.endTime);

    if (!data) {
      res.status(404).json({
        status: "error",
        message: "User role not found",
      });
      return;
    }

    this.sendResponse(res, data, "User role ended successfully");
  });
}
