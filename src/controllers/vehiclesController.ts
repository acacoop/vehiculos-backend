import { BaseController } from './baseController';
import { Vehicle } from '../interfaces/vehicle';
import { 
  getAllVehicles, 
  getVehicleById, 
  addVehicle, 
  updateVehicle, 
  deleteVehicle
} from '../services/vehicles/vehiclesService';

export class VehiclesController extends BaseController {
  constructor() {
    super('Vehicle');
  }

  // Implement abstract methods from BaseController
  protected async getAllService(options: { limit: number; offset: number; searchParams?: Record<string, string> }) {
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
}

// Export singleton instance
export const vehiclesController = new VehiclesController();
