import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { VehiclesService } from "../services/vehiclesService";
import { IVehicleRepository } from "../repositories/interfaces/IVehicleRepository";
import { VehicleResponsiblesService } from "../services/vehicleResponsiblesService";
import type { VehicleResponsibleWithDetails } from "../services/vehicleResponsiblesService";
import { Vehicle as VehicleEntity } from "../entities/Vehicle";
import { VehicleModel } from "../entities/VehicleModel";
import { VehicleBrand } from "../entities/VehicleBrand";
import { Repository } from "typeorm";

describe("VehiclesService", () => {
  let service: VehiclesService;
  let mockVehicleRepo: jest.Mocked<IVehicleRepository>;
  let mockResponsiblesService: jest.Mocked<VehicleResponsiblesService>;
  let mockVehicleModelRepo: jest.Mocked<Repository<VehicleModel>>;

  const mockBrand: VehicleBrand = {
    id: "brand-1",
    name: "Toyota",
  };

  const mockModel: VehicleModel = {
    id: "model-1",
    name: "Corolla",
    brand: mockBrand,
  };

  const mockVehicle: VehicleEntity = {
    id: "vehicle-1",
    licensePlate: "ABC123",
    year: 2020,
    chassisNumber: "CHASSIS123",
    engineNumber: "ENGINE123",
    vehicleType: "sedan",
    transmission: "manual",
    fuelType: "gasoline",
    model: mockModel,
  };

  beforeEach(() => {
    mockVehicleRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findWithDetails: jest.fn(),
    } as jest.Mocked<IVehicleRepository>;

    mockResponsiblesService = {
      getCurrentForVehicle: jest.fn(),
    } as unknown as jest.Mocked<VehicleResponsiblesService>;

    mockVehicleModelRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleModel>>;

    service = new VehiclesService(
      mockVehicleRepo,
      mockResponsiblesService,
      mockVehicleModelRepo,
    );
  });

  describe("getAll", () => {
    it("should return all vehicles with pagination", async () => {
      mockVehicleRepo.findAndCount.mockResolvedValue([[mockVehicle], 1]);

      const result = await service.getAll({ limit: 10, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].licensePlate).toBe("ABC123");
      expect(mockVehicleRepo.findAndCount).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
    });

    it("should handle empty results", async () => {
      mockVehicleRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAll();

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("should return vehicle with current responsible", async () => {
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      const mockResponsible: Partial<VehicleResponsibleWithDetails> = {
        id: "resp-1",
        startDate: "2024-01-01",
        endDate: null,
      };
      mockResponsiblesService.getCurrentForVehicle.mockResolvedValue(
        mockResponsible as VehicleResponsibleWithDetails,
      );

      const result = await service.getById("vehicle-1");

      expect(result).toBeDefined();
      expect(result?.licensePlate).toBe("ABC123");
      expect(result?.currentResponsible).toBeDefined();
      expect(mockVehicleRepo.findOne).toHaveBeenCalledWith("vehicle-1");
    });

    it("should return null when vehicle not found", async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      const result = await service.getById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new vehicle", async () => {
      mockVehicleModelRepo.findOne.mockResolvedValue(mockModel);
      mockVehicleRepo.create.mockReturnValue(mockVehicle);
      mockVehicleRepo.save.mockResolvedValue(mockVehicle);

      const input = {
        licensePlate: "ABC123",
        modelId: "model-1",
        year: 2020,
        chassisNumber: "CHASSIS123",
        engineNumber: "ENGINE123",
        vehicleType: "sedan",
        transmission: "manual",
        fuelType: "gasoline",
      };

      const result = await service.create(input);

      expect(result).toBeDefined();
      expect(result?.licensePlate).toBe("ABC123");
      expect(mockVehicleModelRepo.findOne).toHaveBeenCalledWith({
        where: { id: "model-1" },
        relations: { brand: true },
      });
      expect(mockVehicleRepo.save).toHaveBeenCalled();
    });

    it("should return null when model not found", async () => {
      mockVehicleModelRepo.findOne.mockResolvedValue(null);

      const input = {
        licensePlate: "ABC123",
        modelId: "invalid-model",
        year: 2020,
      };

      const result = await service.create(input);

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update an existing vehicle", async () => {
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepo.save.mockResolvedValue({
        ...mockVehicle,
        licensePlate: "XYZ789",
      });

      const result = await service.update("vehicle-1", {
        licensePlate: "XYZ789",
      });

      expect(result).toBeDefined();
      expect(result?.licensePlate).toBe("XYZ789");
      expect(mockVehicleRepo.save).toHaveBeenCalled();
    });

    it("should return null when vehicle not found", async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      const result = await service.update("nonexistent", {
        licensePlate: "XYZ789",
      });

      expect(result).toBeNull();
    });

    it("should update model when modelId provided", async () => {
      const newModel = { ...mockModel, id: "model-2", name: "Camry" };
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockVehicleModelRepo.findOne.mockResolvedValue(newModel);
      mockVehicleRepo.save.mockResolvedValue({
        ...mockVehicle,
        model: newModel,
      });

      const result = await service.update("vehicle-1", { modelId: "model-2" });

      expect(result).toBeDefined();
      expect(mockVehicleModelRepo.findOne).toHaveBeenCalledWith({
        where: { id: "model-2" },
        relations: { brand: true },
      });
    });
  });

  describe("delete", () => {
    it("should delete a vehicle successfully", async () => {
      mockVehicleRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete("vehicle-1");

      expect(result).toBe(true);
      expect(mockVehicleRepo.delete).toHaveBeenCalledWith("vehicle-1");
    });

    it("should return false when vehicle not found", async () => {
      mockVehicleRepo.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete("nonexistent");

      expect(result).toBe(false);
    });
  });
});
