import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import UsersService from "../services/usersService";
import {
  AUTH_BYPASS,
  AUTH_BYPASS_EMAIL,
  AUTH_BYPASS_ROLES,
} from "../config/env.config";
import { extractBearer, verifyEntraAccessToken } from "../utils/jwtAzure";
const usersService = new UsersService();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    roles?: string[];
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
    // Optional headers (used only if AUTH_BYPASS=true):
    // - x-dev-impersonate: email or entraId
    // - x-dev-roles: role1,role2
    if (AUTH_BYPASS) {
      const impersonate =
        (req.headers["x-dev-impersonate"] as string | undefined) ||
        AUTH_BYPASS_EMAIL ||
        "";
      const rawRoles =
        (req.headers["x-dev-roles"] as string | undefined) ||
        AUTH_BYPASS_ROLES ||
        "";
      const roles = rawRoles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let user = null;
      if (impersonate.includes("@")) user = await usersService.getByEmail(impersonate);
      if (!user && impersonate) user = await usersService.getByEntraId(impersonate);
      // As a last resort, pick the first active user for quick local testing
      if (!user) {
        const { items } = await usersService.getAll({ limit: 1, offset: 0 });
        user = items[0] || null;
      }
      if (!user) {
        throw new AppError(
          "Impersonation failed: no users present",
          500,
          "https://example.com/problems/server-error",
          "Server Error",
        );
      }
      console.warn(
        "[AUTH_BYPASS] Impersonating user",
        impersonate || `${user.firstName} ${user.lastName} <${user.email}>`,
        roles.length ? `(roles: ${roles.join(", ")})` : "",
      );
      req.user = {
        id: user.id!,
        email: user.email || "",
        name: `${user.firstName} ${user.lastName}`.trim(),
        roles,
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

    const roles = (verified.payload.roles || []) as string[];
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
      roles,
      entraId,
      raw: verified.payload,
    };
    next();
  } catch (err) {
    next(err);
  }
};

// Authorization middleware factory by role claim
export const requireRole = (...required: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const roles = req.user?.roles || [];
    const ok = required.every((r) => roles.includes(r));
    if (!ok) {
      return next(
        new AppError(
          "Forbidden",
          403,
          "https://example.com/problems/forbidden",
          "Forbidden",
        ),
      );
    }
    next();
  };
};
