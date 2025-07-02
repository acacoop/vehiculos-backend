import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { User } from '../interfaces/user';
import { 
  getAllUsers, 
  getUserById, 
  addUser, 
  updateUser, 
  deleteUser,
  getUserByEmail,
  getUserByDni 
} from '../services/usersService';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export class UsersController extends BaseController {
  constructor() {
    super('User');
  }
  // Implement abstract methods from BaseController
  protected async getAllService(options: { limit: number; offset: number }) {
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

  // Custom methods specific to users
  public getUserByEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;
    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new AppError(
        `User with email ${email} was not found`,
        404,
        'https://example.com/problems/user-not-found',
        'User Not Found'
      );
    }
    
    this.sendResponse(res, user);
  });

  public getUserByDni = asyncHandler(async (req: Request, res: Response) => {
    const { dni } = req.params;
    const user = await getUserByDni(dni);
    
    if (!user) {
      throw new AppError(
        `User with DNI ${dni} was not found`,
        404,
        'https://example.com/problems/user-not-found',
        'User Not Found'
      );
    }
    
    this.sendResponse(res, user);
  });
}

// Export singleton instance
export const usersController = new UsersController();
