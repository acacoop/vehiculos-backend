import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";
import UsersService from "../services/usersService";
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

// Middleware: validate token by calling Microsoft Graph /me and map to internal user
export const requireAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;
    if (!token) {
      throw new AppError(
        "Missing bearer token",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );
    }

    const resp = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=id,displayName,givenName,surname,mail,userPrincipalName",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("Graph /me validation failed:", resp.status, text);
      throw new AppError(
        "Invalid token",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );
    }
    const me = (await resp.json()) as {
      id: string;
      displayName?: string;
      givenName?: string;
      surname?: string;
      mail?: string;
      userPrincipalName?: string;
    };

    const entraId = me.id;
    const roles: string[] = [];
    if (!entraId) {
      throw new AppError(
        "User id missing from Graph profile",
        401,
        "https://example.com/problems/unauthorized",
        "Unauthorized",
      );
    }

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
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      roles,
      entraId,
      raw: me,
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
