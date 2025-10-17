import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { MaintenanceRecordsService } from "../services/maintenancesService";
import { IMaintenanceRecordRepository } from "../repositories/interfaces/IMaintenanceRecordRepository";
import { MaintenanceRecord as MaintenanceRecordEntity } from "../entities/MaintenanceRecord";
import { AssignedMaintenance } from "../entities/AssignedMaintenance";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import { Maintenance } from "../entities/Maintenance";
import { Repository } from "typeorm";

describe("MaintenanceRecordsService", () => {
  let service: MaintenanceRecordsService;
  let mockRecordRepo: jest.Mocked<IMaintenanceRecordRepository>;
  let mockMaintenanceRecordEntityRepo: jest.Mocked<
    Repository<MaintenanceRecordEntity>
  >;
  let mockAssignedRepo: jest.Mocked<Repository<AssignedMaintenance>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    cuit: "20-12345678-9",
    email: "john@example.com",
    active: true,
    entraId: "entra-123",
  };

  const mockAssignedMaintenance: AssignedMaintenance = {
    id: "assigned-1",
    vehicle: {} as Vehicle,
    maintenance: {} as Maintenance,
    kilometersFrequency: 10000,
    daysFrequency: null,
    observations: null,
    instructions: null,
  };

  const mockRecord: MaintenanceRecordEntity = {
    id: "record-1",
    assignedMaintenance: mockAssignedMaintenance,
    user: mockUser,
    date: "2024-01-15",
    kilometers: 5000,
    notes: "Routine check",
  };

  beforeEach(() => {
    mockRecordRepo = {
      qb: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findByVehicle: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findByAssignedMaintenance: jest.fn(),
    } as jest.Mocked<IMaintenanceRecordRepository>;

    mockMaintenanceRecordEntityRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<MaintenanceRecordEntity>>;

    mockAssignedRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<AssignedMaintenance>>;

    mockUserRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    service = new MaintenanceRecordsService(
      mockRecordRepo as unknown as IMaintenanceRecordRepository,
      mockMaintenanceRecordEntityRepo,
      mockAssignedRepo,
      mockUserRepo,
    );
  });

  describe("getAll", () => {
    it("should return all maintenance records with pagination", async () => {
      mockRecordRepo.findAndCount.mockResolvedValue([[mockRecord], 1]);

      const result = await service.getAll({
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("record-1");
      expect(result.items[0].kilometers).toBe(5000);
      expect(mockRecordRepo.findAndCount).toHaveBeenCalledWith({
        pagination: { limit: 10, offset: 0 },
      });
    });

    it("should handle empty results", async () => {
      mockRecordRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAll();

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it("should apply search filters", async () => {
      mockRecordRepo.findAndCount.mockResolvedValue([[mockRecord], 1]);

      const result = await service.getAll({
        pagination: { limit: 10, offset: 0 },
        filters: { vehicleId: "vehicle-1" },
      });

      expect(result.total).toBe(1);
      expect(mockRecordRepo.findAndCount).toHaveBeenCalledWith({
        pagination: { limit: 10, offset: 0 },
        filters: { vehicleId: "vehicle-1" },
      });
    });
  });

  describe("getById", () => {
    it("should return a maintenance record by id", async () => {
      mockRecordRepo.findOne.mockResolvedValue(mockRecord);

      const result = await service.getById("record-1");

      expect(result).toBeDefined();
      expect(result?.id).toBe("record-1");
      expect(result?.kilometers).toBe(5000);
      expect(mockRecordRepo.findOne).toHaveBeenCalledWith("record-1");
    });

    it("should return null when record not found", async () => {
      mockRecordRepo.findOne.mockResolvedValue(null);

      const result = await service.getById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getByVehicle", () => {
    it("should return all records for a vehicle", async () => {
      mockRecordRepo.findByVehicle.mockResolvedValue([mockRecord]);

      const result = await service.getByVehicle("vehicle-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("record-1");
      expect(mockRecordRepo.findByVehicle).toHaveBeenCalledWith("vehicle-1");
    });

    it("should return empty array when no records exist", async () => {
      mockRecordRepo.findByVehicle.mockResolvedValue([]);

      const result = await service.getByVehicle("vehicle-1");

      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new maintenance record", async () => {
      mockAssignedRepo.findOne.mockResolvedValue(mockAssignedMaintenance);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockMaintenanceRecordEntityRepo.save.mockResolvedValue(mockRecord);

      const input = {
        assignedMaintenanceId: "assigned-1",
        userId: "user-1",
        date: new Date("2024-01-15"),
        kilometers: 5000,
        notes: "Routine check",
      };

      const result = await service.create(input);

      expect(result).toBeDefined();
      expect(result!.kilometers).toBe(5000);
      expect(mockMaintenanceRecordEntityRepo.save).toHaveBeenCalled();
    });

    it("should return null when assigned maintenance not found", async () => {
      mockAssignedRepo.findOne.mockResolvedValue(null);

      const input = {
        assignedMaintenanceId: "invalid",
        userId: "user-1",
        date: new Date("2024-01-15"),
        kilometers: 5000,
      };

      const result = await service.create(input);

      expect(result).toBeNull();
    });

    it("should return null when user not found", async () => {
      mockAssignedRepo.findOne.mockResolvedValue(mockAssignedMaintenance);
      mockUserRepo.findOne.mockResolvedValue(null);

      const input = {
        assignedMaintenanceId: "assigned-1",
        userId: "invalid",
        date: new Date("2024-01-15"),
        kilometers: 5000,
      };

      const result = await service.create(input);

      expect(result).toBeNull();
    });
  });
});
