import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getAllMaintenances } from '../services/vehicles/maintenance/posibles';
import { ApiResponse } from './baseController';

export class MaintenancePosiblesController {
  // GET: Fetch all possible maintenances
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const maintenances = await getAllMaintenances();
    
    const response: ApiResponse<typeof maintenances> = {
      status: 'success',
      data: maintenances
    };
    
    res.status(200).json(response);
  });
}

export const maintenancePosiblesController = new MaintenancePosiblesController();
