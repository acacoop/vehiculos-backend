import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { MaintenanceRecordSchema } from '../schemas/maintenance/maintanceRecord';
import {
  addMaintenanceRecord,
  getMaintenanceRecordsByVehicle,
  getMaintenanceRecordById,
  getAllMaintenanceRecords,
} from '../services/vehicles/maintenance/records';
import type { MaintenanceRecord } from '../types';
import { ApiResponse } from './baseController';

export class MaintenanceRecordsController {
  // GET: Fetch all maintenance records with pagination and search
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Extract search parameters (excluding pagination params)
    const searchParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'page' && key !== 'limit' && typeof value === 'string') {
        searchParams[key] = value;
      }
    }

    const { items, total } = await getAllMaintenanceRecords({ limit, offset, searchParams });
    
    const totalPages = Math.ceil(total / limit);
    
    const response: ApiResponse<MaintenanceRecord[]> = {
      status: 'success',
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages
      }
    };
    
    res.status(200).json(response);
  });

  // GET: Fetch maintenance records for a specific vehicle
  getByVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = req.params.vehicleId;
    
    const records = await getMaintenanceRecordsByVehicle(vehicleId);
    
    const response: ApiResponse<MaintenanceRecord[]> = {
      status: 'success',
      data: records
    };
    
    res.status(200).json(response);
  });

  // GET: Fetch a specific maintenance record by ID
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    
    const record = await getMaintenanceRecordById(id);
    
    if (!record) {
      res.status(404).json({
        status: 'error',
        message: 'Maintenance record not found'
      });
      return;
    }
    
    const response: ApiResponse<MaintenanceRecord> = {
      status: 'success',
      data: record
    };
    
    res.status(200).json(response);
  });

  // POST: Create a new maintenance record
  create = asyncHandler(async (req: Request, res: Response) => {
    const maintenanceRecord: MaintenanceRecord = MaintenanceRecordSchema.parse(req.body);
    
    const newRecord = await addMaintenanceRecord(maintenanceRecord);
    
    const response: ApiResponse<typeof newRecord> = {
      status: 'success',
      data: newRecord,
      message: 'Maintenance record created successfully'
    };
    
    res.status(201).json(response);
  });
}

export const maintenanceRecordsController = new MaintenanceRecordsController();
