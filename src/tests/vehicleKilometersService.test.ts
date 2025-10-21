import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { VehicleKilometersService } from "@/services/vehicleKilometersService";
import { IVehicleKilometersRepository } from "@/repositories/interfaces/IVehicleKilometersRepository";
import { VehicleKilometers as VehicleKilometersEntity } from "@/entities/VehicleKilometers";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { VehicleModel } from "@/entities/VehicleModel";
import { VehicleKilometersRepository } from "@/repositories/VehicleKilometersRepository";
import { Repository } from "typeorm";

describe("VehicleKilometersService", () => {
  let service: VehicleKilometersService;
  let mockRepo: jest.Mocked<IVehicleKilometersRepository>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockVehicleRepo: jest.Mocked<Repository<Vehicle>>;

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
    model: {} as VehicleModel,
  };

  const mockKilometers: VehicleKilometersEntity = {
    id: "km-1",
    vehicle: mockVehicle,
    user: mockUser,
    date: new Date("2024-01-15"),
    kilometers: 5000,
    createdAt: new Date("2024-01-15"),
  };

  beforeEach(() => {
    mockRepo = {
      findByVehicle: jest.fn(),
      qb: jest.fn(),
      findPrev: jest.fn(),
      findNext: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<IVehicleKilometersRepository>;

    mockUserRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    mockVehicleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

    // Create service with mock repo
    service = new VehicleKilometersService(
      mockRepo as unknown as VehicleKilometersRepository,
    );
    // Override the repo getters
    (service as unknown as { userRepo: () => Repository<User> }).userRepo =
      () => mockUserRepo;
    (
      service as unknown as { vehicleRepo: () => Repository<Vehicle> }
    ).vehicleRepo = () => mockVehicleRepo;
  });

  describe("getByVehicle", () => {
    it("should return all kilometers logs for a vehicle", async () => {
      mockRepo.findByVehicle.mockResolvedValue([mockKilometers]);

      const result = await service.getByVehicle("vehicle-1");

      expect(result).toHaveLength(1);
      expect(result[0].vehicleId).toBe("vehicle-1");
      expect(result[0].kilometers).toBe(5000);
      expect(mockRepo.findByVehicle).toHaveBeenCalledWith("vehicle-1");
    });

    it("should return empty array when no logs exist", async () => {
      mockRepo.findByVehicle.mockResolvedValue([]);

      const result = await service.getByVehicle("vehicle-1");

      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new kilometers log", async () => {
      const logInput = {
        id: "km-2",
        vehicleId: "vehicle-1",
        userId: "user-1",
        date: new Date("2024-01-20"),
        kilometers: 6000,
      };

      mockRepo.findPrev.mockResolvedValue(null);
      mockRepo.findNext.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockRepo.create.mockReturnValue({
        ...mockKilometers,
        ...logInput,
      } as VehicleKilometersEntity);
      mockRepo.save.mockResolvedValue({
        ...mockKilometers,
        ...logInput,
      } as VehicleKilometersEntity);

      const result = await service.create(logInput);

      expect(result.kilometers).toBe(6000);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should throw error when kilometers less than previous", async () => {
      const prevLog = {
        ...mockKilometers,
        kilometers: 7000,
        date: new Date("2024-01-10"),
      };

      mockRepo.findPrev.mockResolvedValue(prevLog);
      mockRepo.findNext.mockResolvedValue(null);

      const logInput = {
        id: "km-2",
        vehicleId: "vehicle-1",
        userId: "user-1",
        date: new Date("2024-01-20"),
        kilometers: 5000,
      };

      await expect(service.create(logInput)).rejects.toThrow(
        "Kilometers 5000 is less than previous recorded 7000",
      );
    });

    it("should throw error when kilometers greater than next", async () => {
      const nextLog = {
        ...mockKilometers,
        kilometers: 6000,
        date: new Date("2024-01-25"),
      };

      mockRepo.findPrev.mockResolvedValue(null);
      mockRepo.findNext.mockResolvedValue(nextLog);

      const logInput = {
        id: "km-2",
        vehicleId: "vehicle-1",
        userId: "user-1",
        date: new Date("2024-01-20"),
        kilometers: 8000,
      };

      await expect(service.create(logInput)).rejects.toThrow(
        "Kilometers 8000 is greater than next recorded 6000",
      );
    });

    it("should throw error when user not found", async () => {
      mockRepo.findPrev.mockResolvedValue(null);
      mockRepo.findNext.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(null);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);

      const logInput = {
        id: "km-2",
        vehicleId: "vehicle-1",
        userId: "invalid-user",
        date: new Date("2024-01-20"),
        kilometers: 6000,
      };

      await expect(service.create(logInput)).rejects.toThrow(
        "User or vehicle not found",
      );
    });

    it("should throw error when vehicle not found", async () => {
      mockRepo.findPrev.mockResolvedValue(null);
      mockRepo.findNext.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockVehicleRepo.findOne.mockResolvedValue(null);

      const logInput = {
        id: "km-2",
        vehicleId: "invalid-vehicle",
        userId: "user-1",
        date: new Date("2024-01-20"),
        kilometers: 6000,
      };

      await expect(service.create(logInput)).rejects.toThrow(
        "User or vehicle not found",
      );
    });
  });
});
