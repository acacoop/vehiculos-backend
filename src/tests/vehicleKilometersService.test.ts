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
    registrationDate: "2020-01-01",
    model: {
      id: "model-1",
      name: "Corolla",
      vehicleType: "Sedan",
      brand: {
        id: "brand-1",
        name: "Toyota",
      },
    } as VehicleModel,
    chassisNumber: undefined,
    engineNumber: undefined,
    transmission: undefined,
    fuelType: undefined,
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
      findAll: jest.fn(),
      findById: jest.fn(),
      findByVehicle: jest.fn(),
      qb: jest.fn(),
      findPrev: jest.fn(),
      findNext: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
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

  describe("getAll", () => {
    it("should return paginated kilometers logs", async () => {
      mockRepo.findAll.mockResolvedValue({
        items: [mockKilometers],
        total: 1,
      });

      const result = await service.getAll({
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].kilometers).toBe(5000);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it("should apply filters correctly", async () => {
      mockRepo.findAll.mockResolvedValue({
        items: [mockKilometers],
        total: 1,
      });

      const result = await service.getAll({
        pagination: { limit: 10, offset: 0 },
        filters: { vehicleId: "vehicle-1" },
      });

      expect(result.items).toHaveLength(1);
      expect(mockRepo.findAll).toHaveBeenCalledWith({
        pagination: { limit: 10, offset: 0 },
        filters: { vehicleId: "vehicle-1" },
      });
    });

    it("should return empty array when no logs exist", async () => {
      mockRepo.findAll.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await service.getAll({
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getById", () => {
    it("should return a kilometers log by id", async () => {
      mockRepo.findById.mockResolvedValue(mockKilometers);

      const result = await service.getById("km-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("km-1");
      expect(result?.kilometers).toBe(5000);
      expect(mockRepo.findById).toHaveBeenCalledWith("km-1");
    });

    it("should return null when log not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.getById("non-existent");

      expect(result).toBeNull();
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
    });
  });

  describe("getByVehicle", () => {
    it("should return all kilometers logs for a vehicle", async () => {
      mockRepo.findByVehicle.mockResolvedValue([mockKilometers]);

      const result = await service.getByVehicle("vehicle-1");

      expect(result).toHaveLength(1);
      expect(result[0].vehicle.id).toBe("vehicle-1");
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

  describe("update", () => {
    it("should update an existing kilometers log", async () => {
      const updateData = {
        vehicleId: "vehicle-1",
        kilometers: 6500,
      };

      mockRepo.findById.mockResolvedValue(mockKilometers);
      mockRepo.findPrev.mockResolvedValue(null);
      mockRepo.findNext.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue({
        ...mockKilometers,
        kilometers: 6500,
      } as VehicleKilometersEntity);

      const result = await service.update("km-1", updateData);

      expect(result).not.toBeNull();
      expect(result?.kilometers).toBe(6500);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should return null when log not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.update("non-existent", {
        vehicleId: "vehicle-1",
        kilometers: 6000,
      });

      expect(result).toBeNull();
    });

    it("should validate kilometers on update", async () => {
      const prevLog = {
        ...mockKilometers,
        id: "km-0",
        kilometers: 7000,
        date: new Date("2024-01-10"),
      };

      mockRepo.findById.mockResolvedValue(mockKilometers);
      mockRepo.findPrev.mockResolvedValue(prevLog);
      mockRepo.findNext.mockResolvedValue(null);

      const updateData = {
        vehicleId: "vehicle-1",
        kilometers: 6000,
      };

      await expect(service.update("km-1", updateData)).rejects.toThrow(
        "Kilometers 6000 is less than previous recorded 7000",
      );
    });

    it("should skip validation for the record being updated", async () => {
      const nextLog = {
        ...mockKilometers,
        id: "km-2",
        kilometers: 8000,
        date: new Date("2024-01-20"),
      };

      mockRepo.findById.mockResolvedValue(mockKilometers);
      mockRepo.findPrev.mockResolvedValue(mockKilometers); // Same as being updated
      mockRepo.findNext.mockResolvedValue(nextLog);
      mockRepo.save.mockResolvedValue({
        ...mockKilometers,
        kilometers: 7500,
      } as VehicleKilometersEntity);

      const updateData = {
        vehicleId: "vehicle-1",
        kilometers: 7500,
      };

      const result = await service.update("km-1", updateData);

      expect(result).not.toBeNull();
      expect(result?.kilometers).toBe(7500);
    });

    it("should update user when userId provided", async () => {
      const newUser = { ...mockUser, id: "user-2", firstName: "Jane" };

      mockRepo.findById.mockResolvedValue(mockKilometers);
      mockRepo.findPrev.mockResolvedValue(null);
      mockRepo.findNext.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(newUser);
      mockRepo.save.mockResolvedValue({
        ...mockKilometers,
        user: newUser,
      } as VehicleKilometersEntity);

      const updateData = {
        vehicleId: "vehicle-1",
        userId: "user-2",
      };

      const result = await service.update("km-1", updateData);

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("user-2");
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: "user-2" },
      });
    });

    it("should throw error when user not found on update", async () => {
      mockRepo.findById.mockResolvedValue(mockKilometers);
      mockUserRepo.findOne.mockResolvedValue(null);

      const updateData = {
        vehicleId: "vehicle-1",
        userId: "invalid-user",
      };

      await expect(service.update("km-1", updateData)).rejects.toThrow(
        "User not found",
      );
    });

    it("should update vehicle when vehicleId provided", async () => {
      const newVehicle = { ...mockVehicle, id: "vehicle-2" };

      mockRepo.findById.mockResolvedValue(mockKilometers);
      mockRepo.findPrev.mockResolvedValue(null);
      mockRepo.findNext.mockResolvedValue(null);
      mockVehicleRepo.findOne.mockResolvedValue(newVehicle);
      mockRepo.save.mockResolvedValue({
        ...mockKilometers,
        vehicle: newVehicle,
      } as VehicleKilometersEntity);

      const updateData = {
        vehicleId: "vehicle-2",
      };

      const result = await service.update("km-1", updateData);

      expect(result).not.toBeNull();
      expect(result?.vehicle.id).toBe("vehicle-2");
      expect(mockVehicleRepo.findOne).toHaveBeenCalledWith({
        where: { id: "vehicle-2" },
        relations: ["model", "model.brand"],
      });
    });

    it("should throw error when vehicle not found on update", async () => {
      mockRepo.findById.mockResolvedValue(mockKilometers);
      mockVehicleRepo.findOne.mockResolvedValue(null);

      const updateData = {
        vehicleId: "invalid-vehicle",
      };

      await expect(service.update("km-1", updateData)).rejects.toThrow(
        "Vehicle not found",
      );
    });
  });

  describe("delete", () => {
    it("should delete a kilometers log", async () => {
      mockRepo.delete.mockResolvedValue(true);

      const result = await service.delete("km-1");

      expect(result).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith("km-1");
    });

    it("should return false when log not found", async () => {
      mockRepo.delete.mockResolvedValue(false);

      const result = await service.delete("non-existent");

      expect(result).toBe(false);
      expect(mockRepo.delete).toHaveBeenCalledWith("non-existent");
    });
  });
});
