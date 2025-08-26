import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { getUserByEntraId } from '../services/usersService';
import { extractBearer, verifyEntraAccessToken } from '../utils/jwtAzure';

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
export const requireAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) throw new AppError('Missing bearer token', 401, 'https://example.com/problems/unauthorized', 'Unauthorized');

    const verified = await verifyEntraAccessToken(token).catch(err => {
      console.error('Token verification failed', err);
      throw new AppError('Invalid token', 401, 'https://example.com/problems/unauthorized', 'Unauthorized');
    });

    const entraId = verified.payload.oid; // user object id
    if (!entraId) throw new AppError('Token missing oid claim', 401, 'https://example.com/problems/unauthorized', 'Unauthorized');

    const roles = (verified.payload.roles || []) as string[];
    const name = verified.payload.name;
    const email = (verified.payload.preferred_username || '') as string;

    const user = await getUserByEntraId(entraId);
    if (!user || !user.active) {
      throw new AppError('User not found or inactive', 403, 'https://example.com/problems/forbidden', 'Forbidden');
    }

    req.user = {
      id: user.id,
      email: user.email || email || '',
      name: `${user.firstName} ${user.lastName}`.trim() || name || '',
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
    const ok = required.every(r => roles.includes(r));
    if (!ok) {
      return next(new AppError('Forbidden', 403, 'https://example.com/problems/forbidden', 'Forbidden'));
    }
    next();
  };
};
