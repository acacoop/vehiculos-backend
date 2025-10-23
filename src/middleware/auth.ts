import { Request, Response, NextFunction } from "express";
import { AppError } from "@/middleware/errorHandler";
import { AUTH_BYPASS } from "@/config/env.config";
import { extractBearer, verifyEntraAccessToken } from "@/utils/index";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";

const serviceFactory = new ServiceFactory(AppDataSource);
const usersService = serviceFactory.createUsersService();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    entraId: string;
    raw?: unknown;
  };
}

// Middleware: validate Azure AD (Entra ID) access token locally using JWKS and map to internal user
export const requireAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    // Dev-only bypass: allow impersonation only when AUTH_BYPASS=true
    // Optional header: x-dev-impersonate: email or entraId
    if (AUTH_BYPASS && req.headers["x-dev-impersonate"]) {
      const impersonate = String(req.headers["x-dev-impersonate"]).trim();

      let user = null;
      if (impersonate.includes("@"))
        user = await usersService.getByEmail(impersonate);
      if (!user && impersonate)
        user = await usersService.getByEntraId(impersonate);
      if (!user) {
        throw new AppError(
          "Impersonation failed: user not found",
          401,
          "https://example.com/problems/unauthorized",
          "Unauthorized",
        );
      }
      console.warn(
        "[AUTH_BYPASS] Impersonating user",
        `${user.firstName} ${user.lastName} <${user.email}>`,
      );
      req.user = {
        id: user.id!,
        email: user.email || "",
        name: `${user.firstName} ${user.lastName}`.trim(),
        entraId: user.entraId || "",
        raw: { bypass: true },
      };
      return next();
    }
    const token = extractBearer(req.headers.authorization);
    if (!token)
      throw new AppError(
        "Missing bearer token",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );

    const verified = await verifyEntraAccessToken(token).catch((err) => {
      console.error("Token verification failed", err);
      throw new AppError(
        "Invalid token",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );
    });

    const entraId = verified.payload.oid; // user object id
    if (!entraId)
      throw new AppError(
        "Token missing oid claim",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );

    const name = verified.payload.name;
    const email = (verified.payload.preferred_username || "") as string;

    const user = await usersService.getByEntraId(entraId);
    if (!user || !user.active) {
      throw new AppError(
        "User not found or inactive",
        403,
        "https://example.com/problems/forbidden",
        "Forbidden",
      );
    }

    // user.id guaranteed (DB PK). Cast after runtime check.
    req.user = {
      id: user.id as string,
      email: user.email || email || "",
      name: `${user.firstName} ${user.lastName}`.trim() || name || "",
      entraId,
      raw: verified.payload,
    };
    next();
  } catch (err) {
    next(err);
  }
};
