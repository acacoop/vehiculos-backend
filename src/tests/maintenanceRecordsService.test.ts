import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { MaintenanceRecordsService } from "@/services/maintenancesService";
import { IMaintenanceRecordRepository } from "@/repositories/interfaces/IMaintenanceRecordRepository";
import { MaintenanceRecord as MaintenanceRecordEntity } from "@/entities/MaintenanceRecord";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { Maintenance } from "@/entities/Maintenance";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { Repository, DataSource } from "typeorm";
import { AppDataSource } from "@/db";
import { VehicleKilometersService } from "@/services/vehicleKilometersService";

// Mock AppDataSource
jest.mock("@/db", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Type for our mock manager - standalone interface for test mocking
interface MockEntityManager {
  create: jest.Mock<() => unknown>;
  save: jest.Mock<() => Promise<unknown>>;
  remove: jest.Mock<() => Promise<unknown>>;
  delete: jest.Mock<() => Promise<unknown>>;
  findOne: jest.Mock<() => Promise<unknown>>;
}

// Type for our mock query runner - standalone interface for test mocking
interface MockQueryRunner {
  connect: jest.Mock<() => Promise<void>>;
  startTransaction: jest.Mock<() => Promise<void>>;
  commitTransaction: jest.Mock<() => Promise<void>>;
  rollbackTransaction: jest.Mock<() => Promise<void>>;
  release: jest.Mock<() => Promise<void>>;
  manager: MockEntityManager;
}

describe("MaintenanceRecordsService", () => {
  let service: MaintenanceRecordsService;
  let mockRecordRepo: jest.Mocked<IMaintenanceRecordRepository>;
  let mockMaintenanceRecordEntityRepo: jest.Mocked<
    Repository<MaintenanceRecordEntity>
  >;
  let mockMaintenanceRepo: jest.Mocked<Repository<Maintenance>>;
  let mockVehicleRepo: jest.Mocked<Repository<Vehicle>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockVehicleKilometersService: jest.Mocked<VehicleKilometersService>;
  let mockQueryRunner: MockQueryRunner;

  const mockUser: User = {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    cuit: "20-12345678-9",
    email: "john@example.com",
    active: true,
    entraId: "entra-123",
  };

  const mockVehicle: Vehicle = {
    id: "vehicle-1",
    licensePlate: "ABC123",
    year: 2020,
    registrationDate: "2020-01-01",
    chassisNumber: "CHASSIS123",
    engineNumber: "ENGINE123",
    transmission: "Manual",
    fuelType: "Gasoline",
    model: {
      id: "model-1",
      name: "Model X",
      vehicleType: "Sedan",
      brand: {
        id: "brand-1",
        name: "Brand Y",
      },
    },
  };

  const mockMaintenance: Maintenance = {
    id: "maintenance-1",
    name: "Oil Change",
    kilometersFrequency: 10000,
    daysFrequency: null,
    observations: null,
    instructions: null,
    category: {
      id: "category-1",
      name: "Engine Maintenance",
    },
  };

  const mockKilometersLog: VehicleKilometers = {
    id: "km-log-1",
    vehicle: mockVehicle,
    user: mockUser,
    date: new Date("2024-01-15"),
    kilometers: 5000,
    createdAt: new Date(),
  };

  const mockRecord: MaintenanceRecordEntity = {
    id: "record-1",
    maintenance: mockMaintenance,
    vehicle: mockVehicle,
    user: mockUser,
    date: "2024-01-15",
    kilometersLog: mockKilometersLog,
    notes: "Routine check",
  };

  beforeEach(() => {
    mockRecordRepo = {
      qb: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findByVehicle: jest.fn(),
      findByMaintenance: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<IMaintenanceRecordRepository>;

    mockMaintenanceRecordEntityRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<MaintenanceRecordEntity>>;

    mockMaintenanceRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Maintenance>>;

    mockVehicleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

    mockUserRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    mockQueryRunner = {
      connect: jest.fn<() => Promise<void>>(),
      startTransaction: jest.fn<() => Promise<void>>(),
      commitTransaction: jest.fn<() => Promise<void>>(),
      rollbackTransaction: jest.fn<() => Promise<void>>(),
      release: jest.fn<() => Promise<void>>(),
      manager: {
        create: jest
          .fn<() => unknown>()
          .mockImplementation(() => mockKilometersLog),
        save: jest
          .fn<() => Promise<unknown>>()
          .mockResolvedValue(mockKilometersLog),
        remove: jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
        delete: jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
        findOne: jest.fn<() => Promise<unknown>>(),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;

    mockVehicleKilometersService = {
      validateKilometersReading: jest
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined),
    } as unknown as jest.Mocked<VehicleKilometersService>;

    // Mock AppDataSource.getRepository for validators
    (AppDataSource.getRepository as jest.Mock).mockImplementation(
      (entity: unknown) => {
        if (entity === Maintenance) return mockMaintenanceRepo;
        if (entity === Vehicle) return mockVehicleRepo;
        if (entity === User) return mockUserRepo;
        return {};
      },
    );

    service = new MaintenanceRecordsService(
      mockRecordRepo as unknown as IMaintenanceRecordRepository,
      mockMaintenanceRecordEntityRepo,
      mockMaintenanceRepo,
      mockVehicleRepo,
      mockUserRepo,
      mockDataSource,
      mockVehicleKilometersService,
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
      expect(result.items[0].kilometersLog.kilometers).toBe(5000);
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
      expect(result?.kilometersLog.kilometers).toBe(5000);
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
      mockMaintenanceRepo.findOne.mockResolvedValue(mockMaintenance);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      // After save, the service calls maintenanceRecordRepo.findOne to get complete entity
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValue(mockRecord);

      const input = {
        maintenanceId: "maintenance-1",
        vehicleId: "vehicle-1",
        userId: "user-1",
        date: new Date("2024-01-15"),
        kilometers: 5000,
        notes: "Routine check",
      };

      const result = await service.create(input);

      expect(result).toBeDefined();
      expect(result!.kilometersLog.kilometers).toBe(5000);
    });

    it("should return null when maintenance not found", async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(null);

      const input = {
        maintenanceId: "invalid",
        vehicleId: "vehicle-1",
        userId: "user-1",
        date: new Date("2024-01-15"),
        kilometers: 5000,
      };

      await expect(service.create(input)).rejects.toThrow(
        "Maintenance with ID invalid does not exist",
      );
    });

    it("should return null when vehicle not found", async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(mockMaintenance);
      mockVehicleRepo.findOne.mockResolvedValue(null);

      const input = {
        maintenanceId: "maintenance-1",
        vehicleId: "invalid",
        userId: "user-1",
        date: new Date("2024-01-15"),
        kilometers: 5000,
      };

      await expect(service.create(input)).rejects.toThrow(
        "Vehicle with ID invalid does not exist",
      );
    });

    it("should return null when user not found", async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(mockMaintenance);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockUserRepo.findOne.mockResolvedValue(null);

      const input = {
        maintenanceId: "maintenance-1",
        vehicleId: "vehicle-1",
        userId: "invalid",
        date: new Date("2024-01-15"),
        kilometers: 5000,
      };

      const result = await service.create(input);

      expect(result).toBeNull();
    });

    it("should rollback transaction on error during create", async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(mockMaintenance);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error("DB Error"));

      const input = {
        maintenanceId: "maintenance-1",
        vehicleId: "vehicle-1",
        userId: "user-1",
        date: new Date("2024-01-15"),
        kilometers: 5000,
      };

      await expect(service.create(input)).rejects.toThrow("DB Error");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    beforeEach(() => {
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValue(mockRecord);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
    });

    it("should update kilometers and notes", async () => {
      const updatedRecord = {
        ...mockRecord,
        notes: "Updated notes",
        kilometersLog: { ...mockKilometersLog, kilometers: 6000 },
      };
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValueOnce(mockRecord);
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValueOnce(
        updatedRecord,
      );

      const result = await service.update(
        "record-1",
        { kilometers: 6000, notes: "Updated notes" },
        "user-1",
      );

      expect(result).toBeDefined();
      expect(
        mockVehicleKilometersService.validateKilometersReading,
      ).toHaveBeenCalledWith("vehicle-1", expect.any(Date), 6000, "km-log-1");
    });

    it("should update only notes without validating kilometers", async () => {
      const updatedRecord = { ...mockRecord, notes: "Only notes updated" };
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValueOnce(mockRecord);
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValueOnce(
        updatedRecord,
      );

      const result = await service.update(
        "record-1",
        { notes: "Only notes updated" },
        "user-1",
      );

      expect(result).toBeDefined();
      expect(
        mockVehicleKilometersService.validateKilometersReading,
      ).not.toHaveBeenCalled();
    });

    it("should return null when record not found", async () => {
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValue(null);

      const result = await service.update(
        "nonexistent",
        { notes: "test" },
        "user-1",
      );

      expect(result).toBeNull();
    });

    it("should update date and recalculate kilometersLog date", async () => {
      // Reset the mock for this specific test
      mockVehicleKilometersService.validateKilometersReading.mockClear();
      mockVehicleKilometersService.validateKilometersReading.mockResolvedValue(
        undefined,
      );

      // Create fresh copies to avoid mutation from previous tests
      const freshKmLog: VehicleKilometers = {
        id: "km-log-1",
        vehicle: mockVehicle,
        user: mockUser,
        date: new Date("2024-01-15"),
        kilometers: 5000,
        createdAt: new Date(),
      };
      const freshRecord: MaintenanceRecordEntity = {
        id: "record-1",
        maintenance: mockMaintenance,
        vehicle: mockVehicle,
        user: mockUser,
        date: "2024-01-15",
        kilometersLog: freshKmLog,
        notes: "Routine check",
      };

      const newDate = new Date("2024-02-15");
      const updatedRecord = {
        ...freshRecord,
        date: "2024-02-15",
        kilometersLog: { ...freshKmLog, date: newDate },
      };
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValueOnce(
        freshRecord,
      );
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValueOnce(
        updatedRecord,
      );

      const result = await service.update(
        "record-1",
        { date: newDate },
        "user-1",
      );

      expect(result).toBeDefined();
      // When only date changes, km validation uses existing km (5000)
      expect(
        mockVehicleKilometersService.validateKilometersReading,
      ).toHaveBeenCalledWith("vehicle-1", newDate, 5000, "km-log-1");
    });

    it("should rollback transaction on validation error", async () => {
      mockVehicleKilometersService.validateKilometersReading.mockRejectedValueOnce(
        new Error("Invalid kilometers"),
      );

      await expect(
        service.update("record-1", { kilometers: 1000 }, "user-1"),
      ).rejects.toThrow("Invalid kilometers");

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete maintenance record and its kilometers log", async () => {
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValue(mockRecord);

      const result = await service.delete("record-1");

      expect(result).toBe(true);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it("should return false when record not found", async () => {
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValue(null);

      const result = await service.delete("nonexistent");

      expect(result).toBe(false);
    });

    it("should rollback transaction on error during delete", async () => {
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValue(mockRecord);
      mockQueryRunner.manager.remove.mockRejectedValueOnce(
        new Error("Delete error"),
      );

      await expect(service.delete("record-1")).rejects.toThrow("Delete error");
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it("should handle record without kilometers log", async () => {
      const recordWithoutKmLog = { ...mockRecord, kilometersLog: null };
      mockMaintenanceRecordEntityRepo.findOne.mockResolvedValue(
        recordWithoutKmLog as unknown as MaintenanceRecordEntity,
      );

      const result = await service.delete("record-1");

      expect(result).toBe(true);
      expect(mockQueryRunner.manager.delete).not.toHaveBeenCalled();
    });
  });
});
