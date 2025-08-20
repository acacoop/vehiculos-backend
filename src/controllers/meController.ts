import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class MeController {
  public getCurrent = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as AuthenticatedRequest;
    // requireAuth guarantees req.user exists; guard just in case
    if (!user) {
      throw new AppError('Unauthorized', 401, 'https://example.com/problems/unauthorized', 'Unauthorized');
    }
    res.status(200).json({ status: 'success', message: 'Current user', data: user });
  });
}

export const meController = new MeController();
