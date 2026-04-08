import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import { asyncHandler, AppError } from "@/middleware/errorHandler";
import { PushTokenService } from "@/services/pushTokenService";
import { PushTokenSchema, PushTokenDeleteSchema } from "@/schemas/pushToken";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";

export class PushTokenController {
  constructor(private readonly service: PushTokenService) {}

  public register = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.id;
      const { token, platform } = PushTokenSchema.parse(req.body);

      const pushToken = await this.service.registerToken(
        userId,
        token,
        platform,
      );
      res.status(201).json({
        status: "success",
        data: {
          id: pushToken.id,
          token: pushToken.token,
          platform: pushToken.platform,
        },
        message: "Push token registered",
      });
    },
  );

  public unregister = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.id;
      const { token } = PushTokenDeleteSchema.parse(req.body);

      const deleted = await this.service.unregisterToken(token, userId);
      if (!deleted) {
        throw new AppError("Push token not found", 404);
      }

      res.status(200).json({
        status: "success",
        message: "Push token unregistered",
      });
    },
  );
}

export function createPushTokenController(
  service?: PushTokenService,
): PushTokenController {
  const svc =
    service ?? new ServiceFactory(AppDataSource).createPushTokenService();
  return new PushTokenController(svc);
}
