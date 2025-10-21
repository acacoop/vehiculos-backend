import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { AssignmentsService } from "@/services/assignmentsService";
import { IAssignmentRepository } from "@/repositories/interfaces/IAssignmentRepository";
import { Assignment } from "@/entities/Assignment";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { Repository } from "typeorm";
import * as validators from "@/utils/validation/entity";

jest.mock("../utils/validation/entity");

describe("AssignmentsService", () => {
  let service: AssignmentsService;
  let mockAssignmentRepo: jest.Mocked<IAssignmentRepository>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockVehicleRepo: jest.Mocked<Repository<Vehicle>>;

  beforeEach(() => {
    mockAssignmentRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findActiveAssignments: jest.fn(),
      hasActiveAssignment: jest.fn(),
    } as unknown as jest.Mocked<IAssignmentRepository>;

    mockUserRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    mockVehicleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

    service = new AssignmentsService(
      mockAssignmentRepo,
      mockUserRepo,
      mockVehicleRepo,
    );
  });

  const createMockAssignment = (): Assignment =>
    ({
      id: "1",
      startDate: "2024-01-01",
      endDate: null,
      user: {
        id: "u1",
        firstName: "John",
        lastName: "Doe",
        cuit: "12345678",
        email: "john@example.com",
        active: true,
        entraId: "entra1",
      } as User,
      vehicle: {
        id: "v1",
        licensePlate: "ABC123",
        year: 2020,
        model: {
          id: "m1",
          name: "Model X",
          brand: { id: "b1", name: "Tesla" },
        },
      } as Vehicle,
    }) as Assignment;

  describe("getAll", () => {
    it("should return paginated assignments", async () => {
      const mockAssignments = [createMockAssignment()];
      mockAssignmentRepo.findAndCount.mockResolvedValue([mockAssignments, 1]);

      const result = await service.getAll({
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("1");
    });

    it("should handle empty results", async () => {
      mockAssignmentRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAll();

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("should return assignment by id", async () => {
      const mockAssignment = createMockAssignment();
      mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
      expect(result?.userId).toBe("u1");
      expect(result?.vehicleId).toBe("v1");
    });

    it("should return null if assignment not found", async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      const result = await service.getById("999");

      expect(result).toBeNull();
    });
  });

  describe("getWithDetailsById", () => {
    it("should return assignment with details", async () => {
      const mockAssignment = createMockAssignment();
      mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);

      const result = await service.getWithDetailsById("1");

      expect(result).not.toBeNull();
      expect(result?.user.firstName).toBe("John");
      expect(result?.vehicle.licensePlate).toBe("ABC123");
    });
  });

  describe("isVehicleAssignedToUser", () => {
    it("should return true if vehicle is assigned", async () => {
      mockAssignmentRepo.count.mockResolvedValue(1);

      const result = await service.isVehicleAssignedToUser("u1", "v1");

      expect(result).toBe(true);
    });

    it("should return false if vehicle is not assigned", async () => {
      mockAssignmentRepo.count.mockResolvedValue(0);

      const result = await service.isVehicleAssignedToUser("u1", "v1");

      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    it("should create a new assignment", async () => {
      const mockUser = { id: "u1", firstName: "John" } as User;
      const mockVehicle = { id: "v1", licensePlate: "ABC123" } as Vehicle;
      const mockCreated = createMockAssignment();

      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockAssignmentRepo.create.mockReturnValue(mockCreated);
      mockAssignmentRepo.save.mockResolvedValue(mockCreated);

      const result = await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: "2024-01-01",
      });

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("u1");
      expect(mockAssignmentRepo.save).toHaveBeenCalled();
    });

    it("should return null if user not found", async () => {
      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockUserRepo.findOne.mockResolvedValue(null);
      mockVehicleRepo.findOne.mockResolvedValue({} as Vehicle);

      const result = await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: "2024-01-01",
      });

      expect(result).toBeNull();
    });

    it("should throw error if endDate is before startDate", async () => {
      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);

      await expect(
        service.create({
          userId: "u1",
          vehicleId: "v1",
          startDate: "2024-01-10",
          endDate: "2024-01-05",
        }),
      ).rejects.toThrow("End date must be after start date");
    });
  });

  describe("update", () => {
    it("should update an assignment", async () => {
      const mockAssignment = createMockAssignment();
      const mockUser = { id: "u2", firstName: "Jane" } as User;

      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockAssignmentRepo.save.mockResolvedValue({
        ...mockAssignment,
        user: mockUser,
      });

      const result = await service.update("1", { userId: "u2" });

      expect(result).not.toBeNull();
      expect(mockAssignmentRepo.save).toHaveBeenCalled();
    });

    it("should return null if assignment not found", async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      const result = await service.update("999", { userId: "u2" });

      expect(result).toBeNull();
    });
  });

  describe("finish", () => {
    it("should finish an assignment with default end date", async () => {
      const mockAssignment = createMockAssignment();
      mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);
      mockAssignmentRepo.save.mockResolvedValue({
        ...mockAssignment,
        endDate: "2024-01-10",
      });

      const result = await service.finish("1");

      expect(result).not.toBeNull();
      expect(result?.endDate).toBeTruthy();
      expect(mockAssignmentRepo.save).toHaveBeenCalled();
    });

    it("should finish an assignment with provided end date", async () => {
      const mockAssignment = createMockAssignment();
      mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);
      mockAssignmentRepo.save.mockResolvedValue({
        ...mockAssignment,
        endDate: "2024-01-15",
      });

      const result = await service.finish("1", "2024-01-15");

      expect(result).not.toBeNull();
      expect(result?.endDate).toBe("2024-01-15");
    });

    it("should return null if assignment not found", async () => {
      mockAssignmentRepo.findOne.mockResolvedValue(null);

      const result = await service.finish("999");

      expect(result).toBeNull();
    });

    it("should throw error if endDate is before startDate", async () => {
      const mockAssignment = createMockAssignment();
      mockAssignmentRepo.findOne.mockResolvedValue(mockAssignment);

      await expect(service.finish("1", "2023-12-31")).rejects.toThrow(
        "End date must be after start date",
      );
    });
  });
});
