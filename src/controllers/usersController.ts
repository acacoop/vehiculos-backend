import { BaseController } from './baseController';
import { User } from '../interfaces/user';
import { 
  getAllUsers, 
  getUserById, 
  addUser, 
  updateUser, 
  deleteUser
} from '../services/usersService';

export class UsersController extends BaseController {
  constructor() {
    super('User');
  }
  // Implement abstract methods from BaseController
  protected async getAllService(options: { limit: number; offset: number; searchParams?: Record<string, string> }) {
    return await getAllUsers(options);
  }

  protected async getByIdService(id: string) {
    return await getUserById(id);
  }

  protected async createService(data: unknown) {
    return await addUser(data as User);
  }

  protected async updateService(id: string, data: Partial<User>) {
    return await updateUser(id, data);
  }

  protected async patchService(id: string, data: Partial<User>) {
    // Para PATCH, usamos la misma lógica que update ya que ambos aceptan datos parciales
    return await updateUser(id, data);
  }

  protected async deleteService(id: string) {
    return await deleteUser(id);
  }
}

// Export singleton instance
export const usersController = new UsersController();
