import { BaseController } from "@/controllers/baseController";
import type { Assignment } from "@/schemas/assignment";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { Request, Response } from "express";
import {
  AssignmentUpdateSchema,
  AssignmentFinishSchema,
} from "@/schemas/assignment";
import { AssignmentsService } from "@/services/assignmentsService";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { AssignmentFilters } from "@/repositories/interfaces/IAssignmentRepository";

export class AssignmentsController extends BaseController<AssignmentFilters> {
  constructor(private readonly service: AssignmentsService) {
    super({
      resourceName: "Assignment",
      allowedFilters: ["userId", "vehicleId", "active"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<AssignmentFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return await this.service.getWithDetailsById(id);
  }

  protected async createService(data: unknown) {
    const assignmentData = data as Omit<Assignment, "id">;
    return await this.service.create(assignmentData);
  }

  protected async updateService(
    id: string,
    data: unknown,
    _req: Request,
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
