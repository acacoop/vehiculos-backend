import { BaseController } from './baseController';
import { Assignment } from '../interfaces/assignment';
import { AppError } from '../middleware/errorHandler';
import { 
  getAllAssignments, 
  getAssignmentById, 
  addAssignment 
} from '../services/vehicles/assignments';

export class AssignmentsController extends BaseController {
  constructor() {
    super('Assignment');
  }
  
  // Implement abstract methods from BaseController
  protected async getAllService(options: { limit: number; offset: number; searchParams?: Record<string, string> }) {
    return await getAllAssignments(options);
  }

  protected async getByIdService(id: string) {
    return await getAssignmentById(id);
  }

  protected async createService(data: unknown) {
    const assignmentData = data as Omit<Assignment, 'id'>;
    return await addAssignment(assignmentData);
  }

  // Not implemented for assignments - these operations are not supported
  protected async updateService(_id: string, _data: unknown): Promise<unknown | null> {
    throw new AppError(
      'Update operation is not supported for assignments',
      405,
      'https://example.com/problems/method-not-allowed',
      'Method Not Allowed'
    );
  }

  protected async patchService(_id: string, _data: unknown): Promise<unknown | null> {
    throw new AppError(
      'Patch operation is not supported for assignments',
      405,
      'https://example.com/problems/method-not-allowed',
      'Method Not Allowed'
    );
  }

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
