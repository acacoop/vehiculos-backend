import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getAllMaintenancesCategories } from '../services/vehicles/maintenance/categories';
import { ApiResponse } from './baseController';

export class MaintenanceCategoriesController {
  // GET: Fetch all maintenance categories
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const categories = await getAllMaintenancesCategories();
    
    const response: ApiResponse<typeof categories> = {
      status: 'success',
      data: categories
    };
    
    res.status(200).json(response);
  });
}

export const maintenanceCategoriesController = new MaintenanceCategoriesController();
