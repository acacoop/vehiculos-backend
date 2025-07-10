import { BaseController } from './baseController';
import { VehicleResponsible } from '../interfaces/vehicleResponsible';
import { AppError } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  getAllVehicleResponsibles, 
  getVehicleResponsibleById, 
  addVehicleResponsible,
  updateVehicleResponsible,
  deleteVehicleResponsible,
  getCurrentResponsibleForVehicle,
  getCurrentVehiclesForUser
} from '../services/vehicleResponsiblesService';

export class VehicleResponsiblesController extends BaseController {
  constructor() {
    super('Vehicle Responsible');
  }
  
  // Implement abstract methods from BaseController
  protected async getAllService(options: { limit: number; offset: number; searchParams?: Record<string, string> }) {
    return await getAllVehicleResponsibles(options);
  }

  protected async getByIdService(id: string) {
    return await getVehicleResponsibleById(id);
  }

  protected async createService(data: unknown) {
    const responsibleData = data as Omit<VehicleResponsible, 'id'>;
    return await addVehicleResponsible(responsibleData);
  }

  protected async updateService(id: string, data: unknown) {
    const responsibleData = data as Partial<VehicleResponsible>;
    return await updateVehicleResponsible(id, responsibleData);
  }

  protected async patchService(id: string, data: unknown) {
    const responsibleData = data as Partial<VehicleResponsible>;
    return await updateVehicleResponsible(id, responsibleData);
  }

  protected async deleteService(id: string) {
    return await deleteVehicleResponsible(id);
  }

  // Custom endpoints
  public getCurrentForVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    
    if (!this.isValidUUID(vehicleId)) {
      throw new AppError(
        `Invalid UUID format provided: ${vehicleId}`,
        400,
        'https://example.com/problems/invalid-uuid',
        'Invalid UUID Format'
      );
    }
    
    const responsible = await getCurrentResponsibleForVehicle(vehicleId);
    
    if (!responsible) {
      throw new AppError(
        `No current responsible found for vehicle ID ${vehicleId}`,
        404,
        'https://example.com/problems/resource-not-found',
        'Resource Not Found'
      );
    }
    
    this.sendResponse(res, responsible);
  });

  public getCurrentVehiclesForUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    
    if (!this.isValidUUID(userId)) {
      throw new AppError(
        `Invalid UUID format provided: ${userId}`,
        400,
        'https://example.com/problems/invalid-uuid',
        'Invalid UUID Format'
      );
    }
    
    const vehicles = await getCurrentVehiclesForUser(userId);
    
    this.sendResponse(res, vehicles);
  });
}

// Export singleton instance
export const vehicleResponsiblesController = new VehicleResponsiblesController();
