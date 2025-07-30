import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AssignedMaintenanceSchema } from '../schemas/maintenance/assignMaintance';
import { AssignedMaintenance } from '../interfaces/maintenance';
import { assignMaintenance, getAssignedMaintenancesByVehicle } from '../services/vehicles/maintenance/assignations';
import { ApiResponse } from './baseController';

export class MaintenanceAssignmentsController {
  // GET: Fetch all maintenance assignments for a specific vehicle
  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    
    const maintenanceRecords = await getAssignedMaintenancesByVehicle(vehicleId);
    
    const response: ApiResponse<AssignedMaintenance[]> = {
      status: 'success',
      data: maintenanceRecords
    };
    
    res.status(200).json(response);
  });

  // POST: Associate a maintenance with a vehicle
  create = asyncHandler(async (req: Request, res: Response) => {
    const assignedMaintenance: AssignedMaintenance = AssignedMaintenanceSchema.parse(req.body);
    
    const result = await assignMaintenance(assignedMaintenance);
    
    const response: ApiResponse<typeof result> = {
      status: 'success',
      data: result,
      message: 'Maintenance assignment created successfully'
    };
    
    res.status(201).json(response);
  });
}

export const maintenanceAssignmentsController = new MaintenanceAssignmentsController();
