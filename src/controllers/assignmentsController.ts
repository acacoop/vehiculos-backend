import { BaseController } from "./baseController";
import type { Assignment } from "../schemas/assignment";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { Request, Response } from "express";
import {
  AssignmentUpdateSchema,
  AssignmentFinishSchema,
} from "../schemas/assignment";
import { AssignmentsService } from "../services/assignmentsService";
import { ServiceFactory } from "../factories/serviceFactory";
import { AppDataSource } from "../db";
import { PermissionFilterRequest } from "../middleware/permissionFilter";
import { RepositoryFindOptions } from "../repositories/interfaces/common";
import { AssignmentSearchParams } from "../repositories/interfaces/IAssignmentRepository";
import { parsePaginationQuery } from "../utils/common";

export class AssignmentsController extends BaseController {
  constructor(private readonly service: AssignmentsService) {
    super("Assignment");
  }

  // Override getAll to use permission filter from middleware
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const permReq = req as PermissionFilterRequest;
    const { page, limit, offset } = parsePaginationQuery(req.query);

    // Extract search parameters (excluding pagination params)
    const searchParams: AssignmentSearchParams = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== "page" && key !== "limit" && typeof value === "string") {
        searchParams[key as keyof AssignmentSearchParams] = value;
      }
    }

    const options: RepositoryFindOptions<AssignmentSearchParams> = {
      pagination: { limit, offset },
      searchParams,
      permissions: permReq.permissionFilter, // Populated by middleware
    };

    const { items, total } = await this.service.getAll(options);

    this.sendResponse(res, items, undefined, 200, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });

  // Implement abstract methods from BaseController
  protected async getAllService(options: {
    limit: number;
    offset: number;
    searchParams?: Record<string, string>;
  }) {
    // This method is overridden by getAll() above
    // Kept for BaseController compatibility
    const { items, total } = await this.service.getAll({
      pagination: { limit: options.limit, offset: options.offset },
      searchParams: options.searchParams,
    });
    return { items, total };
  }

  protected async getByIdService(id: string) {
    return await this.service.getWithDetailsById(id);
  }

  protected async createService(data: unknown) {
    const assignmentData = data as Omit<Assignment, "id">;
    return await this.service.create(assignmentData);
  }

  // Not implemented for assignments - these operations are not supported
  protected async updateService(
    _id: string,
    _data: unknown,
  ): Promise<unknown | null> {
    throw new AppError(
      "Update operation is not supported for assignments. Use PATCH instead.",
      405,
      "https://example.com/problems/method-not-allowed",
      "Method Not Allowed",
    );
  }

  protected async patchService(
    id: string,
    data: unknown,
  ): Promise<unknown | null> {
    // Validate data with Zod schema
    const validationResult = AssignmentUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      throw new AppError(
        validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
        400,
        "https://example.com/problems/validation-error",
        "Validation Error",
      );
    }

    const assignmentData = validationResult.data as Partial<Assignment>;

    try {
      const result = await this.service.update(id, assignmentData);
      return result;
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

  // Custom method to finish/end an assignment
  public finishAssignment = asyncHandler(
    async (req: Request, res: Response) => {
      const id = req.params.id;
      const bodyData = req.body;

      // Validate data with Zod schema
      const validationResult = AssignmentFinishSchema.safeParse(bodyData);
      if (!validationResult.success) {
        throw new AppError(
          validationResult.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
          400,
          "https://example.com/problems/validation-error",
          "Validation Error",
        );
      }

      const { endDate } = validationResult.data;

      try {
        const result = await this.service.finish(id, endDate);

        if (!result) {
          throw new AppError(
            `Assignment with ID ${id} was not found`,
            404,
            "https://example.com/problems/resource-not-found",
            "Resource Not Found",
          );
        }

        this.sendResponse(res, result, "Assignment finished successfully");
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

  protected async deleteService(_id: string): Promise<boolean> {
    throw new AppError(
      "Delete operation is not supported for assignments",
      405,
      "https://example.com/problems/method-not-allowed",
      "Method Not Allowed",
    );
  }
}

export function createAssignmentsController(
  service?: AssignmentsService,
): AssignmentsController {
  const svc =
    service ?? new ServiceFactory(AppDataSource).createAssignmentsService();
  return new AssignmentsController(svc);
}
