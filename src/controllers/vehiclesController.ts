import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { Vehicle } from '../interfaces/vehicle';
import { 
  getAllVehicles, 
  getVehicleById, 
  addVehicle, 
  updateVehicle, 
  deleteVehicle,
  getVehicleByLicensePlate 
} from '../services/vehicles/vehiclesService';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export class VehiclesController extends BaseController {
  constructor() {
    super('Vehicle');
  }

  // Implement abstract methods from BaseController
  protected async getAllService(options: { limit: number; offset: number }) {
    return await getAllVehicles(options);
  }

  protected async getByIdService(id: string) {
    return await getVehicleById(id);
  }

  protected async createService(data: unknown) {
    return await addVehicle(data as Vehicle);
  }

  protected async updateService(id: string, data: Partial<Vehicle>) {
    return await updateVehicle(id, data);
  }

  protected async patchService(id: string, data: Partial<Vehicle>) {
    // Para PATCH, usamos la misma lógica que update ya que ambos aceptan datos parciales
    return await updateVehicle(id, data);
  }

  protected async deleteService(id: string) {
    return await deleteVehicle(id);
  }

  // Custom methods specific to vehicles
  public getVehicleByLicensePlate = asyncHandler(async (req: Request, res: Response) => {
    const { licensePlate } = req.params;
    const vehicle = await getVehicleByLicensePlate(licensePlate);
    
    if (!vehicle) {
      throw new AppError(
        `Vehicle with license plate ${licensePlate} was not found`,
        404,
        'https://example.com/problems/vehicle-not-found',
        'Vehicle Not Found'
      );
    }
    
    this.sendResponse(res, vehicle);
  });
}

// Export singleton instance
export const vehiclesController = new VehiclesController();
