import { Request, Response } from "express";
import { asyncHandler, AppError } from "middleware/errorHandler";
import { AuthenticatedRequest } from "middleware/auth";
import { ServiceFactory } from "factories/serviceFactory";
import { AppDataSource } from "db";

const serviceFactory = new ServiceFactory(AppDataSource);
const usersService = serviceFactory.createUsersService();

export class MeController {
  public getCurrent = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    if (!user) {
      throw new AppError(
        "Unauthorized",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );
    }
    const dbUser = await usersService.getById(user.id);
    if (!dbUser) {
      throw new AppError(
        "User not found",
        404,
        "https://example.com/problems/resource-not-found",
        "Resource Not Found",
      );
    }
    res.status(200).json({ status: "success", data: dbUser });
  });
}

export const meController = new MeController();
