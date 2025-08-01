import { BaseController } from './baseController';
import { Assignment } from '../interfaces/assignment';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  getAllAssignments, 
  getAssignmentById, 
  addAssignment,
  updateAssignment,
  finishAssignment,
  getAssignmentWithDetailsById
} from '../services/vehicles/assignments';
import { Request, Response } from 'express';

export class AssignmentsController extends BaseController {
  constructor() {
    super('Assignment');
  }
  
  // Implement abstract methods from BaseController
  protected async getAllService(options: { limit: number; offset: number; searchParams?: Record<string, string> }) {
    return await getAllAssignments(options);
  }

  protected async getByIdService(id: string) {
    return await getAssignmentWithDetailsById(id);
  }

  protected async createService(data: unknown) {
    const assignmentData = data as Omit<Assignment, 'id'>;
    return await addAssignment(assignmentData);
  }

  // Not implemented for assignments - these operations are not supported
  protected async updateService(_id: string, _data: unknown): Promise<unknown | null> {
    throw new AppError(
      'Update operation is not supported for assignments. Use PATCH instead.',
      405,
      'https://example.com/problems/method-not-allowed',
      'Method Not Allowed'
    );
  }

  protected async patchService(id: string, data: unknown): Promise<unknown | null> {
    const assignmentData = data as Partial<Assignment>;
    
    try {
      const result = await updateAssignment(id, assignmentData);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(
          error.message,
          400,
          'https://example.com/problems/validation-error',
          'Validation Error'
        );
      }
      throw error;
    }
  }

  // Custom method to finish/end an assignment
  public finishAssignment = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const { endDate } = req.body;
    
    // Validate UUID format
    if (!this.isValidUUID(id)) {
      throw new AppError(
        `Invalid UUID format provided: ${id}`,
        400,
        'https://example.com/problems/invalid-uuid',
        'Invalid UUID Format'
      );
    }
    
    try {
      const result = await finishAssignment(id, endDate);
      
      if (!result) {
        throw new AppError(
          `Assignment with ID ${id} was not found`,
          404,
          'https://example.com/problems/resource-not-found',
          'Resource Not Found'
        );
      }
      
      this.sendResponse(res, result, 'Assignment finished successfully');
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(
          error.message,
          400,
          'https://example.com/problems/validation-error',
          'Validation Error'
        );
      }
      throw error;
    }
  });

  protected async deleteService(_id: string): Promise<boolean> {
    throw new AppError(
      'Delete operation is not supported for assignments',
      405,
      'https://example.com/problems/method-not-allowed',
      'Method Not Allowed'
    );
  }
}

// Export singleton instance
export const assignmentsController = new AssignmentsController();
