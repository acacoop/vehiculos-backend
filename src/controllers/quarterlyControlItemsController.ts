import { BaseController } from "@/controllers/baseController";
import { AppError } from "@/middleware/errorHandler";
import { QuarterlyControlItemSchema } from "@/schemas/quarterlyControlItem";
import { QuarterlyControlItemsService } from "@/services/quarterlyControlItemsService";
import type { QuarterlyControlItem } from "@/schemas/quarterlyControlItem";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { QuarterlyControlItemFilters } from "@/repositories/interfaces/IQuarterlyControlItemRepository";
import type { Request } from "express";

export class QuarterlyControlItemsController extends BaseController<QuarterlyControlItemFilters> {
  constructor(private readonly service: QuarterlyControlItemsService) {
    super({
      resourceName: "QuarterlyControlItem",
      allowedFilters: ["quarterlyControlId", "status"],
    });
  }

  protected async getAllService(
    options: RepositoryFindOptions<Partial<QuarterlyControlItemFilters>>,
  ) {
    return this.service.getAll(options);
  }

  protected async getByIdService(id: string) {
    return this.service.getById(id);
  }

  protected async createService(data: unknown) {
    const quarterlyControlItem = QuarterlyControlItemSchema.parse(data);
    try {
      return await this.service.create(
        quarterlyControlItem as QuarterlyControlItem,
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

  protected async updateService(id: string, data: unknown, _req: Request) {
    const parsed = QuarterlyControlItemSchema.partial().parse(data);
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
}

export function createQuarterlyControlItemsController() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const service = serviceFactory.createQuarterlyControlItemsService();
  return new QuarterlyControlItemsController(service);
}

export const quarterlyControlItemsController =
  createQuarterlyControlItemsController();
