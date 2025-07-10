import { BaseController } from './baseController';
import { User } from '../interfaces/user';
import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { 
  getAllUsers, 
  getUserById, 
  addUser, 
  updateUser, 
  deleteUser,
  activateUser as activateUserService,
  deactivateUser as deactivateUserService
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

  // Custom endpoints following BaseController pattern
  public activate = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    
    try {
      const result = await activateUserService(id);
      
      if (!result) {
        throw new AppError(
          `${this.resourceName} with ID ${id} was not found`,
          404,
          'https://example.com/problems/resource-not-found',
          'Resource Not Found'
        );
      }
      
      this.sendResponse(res, result, `${this.resourceName} activated successfully`);
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_ACTIVE') {
        throw new AppError(
          'User is already active',
          409,
          'https://example.com/problems/invalid-state-transition',
          'Invalid State Transition'
        );
      }
      throw error;
    }
  });

  public deactivate = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    
    try {
      const result = await deactivateUserService(id);
      
      if (!result) {
        throw new AppError(
          `${this.resourceName} with ID ${id} was not found`,
          404,
          'https://example.com/problems/resource-not-found',
          'Resource Not Found'
        );
      }
      
      this.sendResponse(res, result, `${this.resourceName} deactivated successfully`);
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_INACTIVE') {
        throw new AppError(
          'User is already inactive',
          409,
          'https://example.com/problems/invalid-state-transition',
          'Invalid State Transition'
        );
      }
      throw error;
    }
  });
}

// Export singleton instance
export const usersController = new UsersController();
