import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";
import { PushTokenService } from "@/services/pushTokenService";
import { PushTokenSchema, PushTokenDeleteSchema } from "@/schemas/pushToken";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";

export class PushTokenController {
  constructor(private readonly service: PushTokenService) {}

  public register = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user) {
        res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
        return;
      }
      const userId = req.user.id;
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
      if (!req.user) {
        res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
        return;
      }
      const userId = req.user.id;
      const { token } = PushTokenDeleteSchema.parse(req.body);

      const deleted = await this.service.unregisterToken(token, userId);
      if (!deleted) {
        res.status(404).json({
          status: "error",
          message: "Push token not found",
        });
        return;
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
