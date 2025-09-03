import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import UsersService from "../services/usersService";
const usersService = new UsersService();

export class MeController {
  public getCurrent = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    // requireAuth guarantees req.user exists; guard just in case
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
      // Should not happen because middleware validated, but handle gracefully
      throw new AppError(
        "User not found",
        404,
        "https://example.com/problems/resource-not-found",
        "Resource Not Found",
      );
    }
    // Return in the same format as other user endpoints
    res.status(200).json({ status: "success", data: dbUser });
  });
}

export const meController = new MeController();
