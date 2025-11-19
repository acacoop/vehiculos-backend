import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { MaintenancesService } from "@/services/maintenancesService";
import { IMaintenanceRepository } from "@/repositories/interfaces/IMaintenanceRepository";
import { IMaintenanceRequirementRepository } from "@/repositories/interfaces/IMaintenanceRequirementRepository";
import { Maintenance } from "@/entities/Maintenance";
import { MaintenanceCategory } from "@/entities/MaintenanceCategory";
import { Repository } from "typeorm";
import * as validators from "@/utils/validation/entity";

jest.mock("../utils/validation/entity");

describe("MaintenancesService", () => {
  let service: MaintenancesService;
  let mockRepo: jest.Mocked<IMaintenanceRepository>;
  let mockMaintenanceCategoryRepo: jest.Mocked<Repository<MaintenanceCategory>>;
  let mockRequirementRepo: jest.Mocked<IMaintenanceRequirementRepository>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IMaintenanceRepository>;

    mockMaintenanceCategoryRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<MaintenanceCategory>>;

    mockRequirementRepo = {
      findByMaintenance: jest.fn(),
      findByVehicle: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findOverlapping: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IMaintenanceRequirementRepository>;

    service = new MaintenancesService(
      mockRepo,
      mockRequirementRepo,
      mockMaintenanceCategoryRepo,
    );
  });

  const createMockMaintenance = (): Maintenance =>
    ({
      id: "1",
      name: "Oil Change",
      category: {
        id: "c1",
        name: "Engine",
      } as MaintenanceCategory,
      kilometersFrequency: 10000,
      daysFrequency: 180,
      observations: "Check oil level",
      instructions: "Use synthetic oil",
    }) as Maintenance;

  describe("getAll", () => {
    it("should return all maintenances", async () => {
      const mockMaintenances = [createMockMaintenance()];
      mockRepo.findAndCount.mockResolvedValue([mockMaintenances, 1]);

      const result = await service.getAll();

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe("Oil Change");
    });
  });

  describe("getById", () => {
    it("should return maintenance by id", async () => {
      const mock = createMockMaintenance();
      mockRepo.findOne.mockResolvedValue(mock);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
    });

    it("should return null if not found", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.getById("999");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new maintenance", async () => {
      const mockCategory = { id: "c1", name: "Engine" } as MaintenanceCategory;
      const mockCreated = createMockMaintenance();

      jest
        .spyOn(validators, "validateMaintenanceCategoryExists")
        .mockResolvedValue(undefined);
      mockMaintenanceCategoryRepo.findOne.mockResolvedValue(mockCategory);
      mockRepo.create.mockReturnValue(mockCreated);
      mockRepo.save.mockResolvedValue(mockCreated);

      const result = await service.create({
        categoryId: "c1",
        name: "Oil Change",
        kilometersFrequency: 10000,
        daysFrequency: 180,
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Oil Change");
    });

    it("should return null if category not found", async () => {
      jest
        .spyOn(validators, "validateMaintenanceCategoryExists")
        .mockResolvedValue(undefined);
      mockMaintenanceCategoryRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        categoryId: "c1",
        name: "Oil Change",
      });

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a maintenance", async () => {
      const mockMaintenance = createMockMaintenance();

      mockRepo.findOne.mockResolvedValue(mockMaintenance);
      mockRepo.save.mockResolvedValue({
        ...mockMaintenance,
        name: "Updated Name",
      });

      const result = await service.update("1", { name: "Updated Name" });

      expect(result).not.toBeNull();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should return null if maintenance not found", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.update("999", { name: "Test" });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a maintenance", async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete("1");

      expect(result).toBe(true);
    });

    it("should return false if not found", async () => {
      mockRepo.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete("999");

      expect(result).toBe(false);
    });
  });
});
