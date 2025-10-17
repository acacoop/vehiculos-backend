import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { VehicleResponsiblesService } from "../services/vehicleResponsiblesService";
import { IVehicleResponsibleRepository } from "../repositories/interfaces/IVehicleResponsibleRepository";
import { VehicleResponsible } from "../entities/VehicleResponsible";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import { Repository } from "typeorm";
import * as validators from "../utils/validation/entity";

jest.mock("../utils/validation/entity");

describe("VehicleResponsiblesService", () => {
  let service: VehicleResponsiblesService;
  let mockRepo: jest.Mocked<IVehicleResponsibleRepository>;
  let mockVehicleRepo: jest.Mocked<Repository<Vehicle>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockVehicleResponsibleRepo: jest.Mocked<Repository<VehicleResponsible>>;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findDetailedById: jest.fn(),
      findCurrentByVehicle: jest.fn(),
      findCurrentForUser: jest.fn(),
      getOverlap: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IVehicleResponsibleRepository>;

    mockVehicleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

    mockUserRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    mockVehicleResponsibleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<VehicleResponsible>>;

    service = new VehicleResponsiblesService(
      mockRepo,
      mockVehicleRepo,
      mockUserRepo,
      mockVehicleResponsibleRepo,
    );
  });

  const createMockVehicleResponsible = (): VehicleResponsible =>
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
    }) as VehicleResponsible;

  describe("getAll", () => {
    it("should return all vehicle responsibles", async () => {
      const mockData = [createMockVehicleResponsible()];
      mockRepo.find.mockResolvedValue([mockData, 1]);

      const result = await service.getAll();

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("1");
    });
  });

  describe("getById", () => {
    it("should return vehicle responsible by id", async () => {
      const mock = createMockVehicleResponsible();
      mockRepo.findDetailedById.mockResolvedValue(mock);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
    });

    it("should return null if not found", async () => {
      mockRepo.findDetailedById.mockResolvedValue(null);

      const result = await service.getById("999");

      expect(result).toBeNull();
    });
  });

  describe("getCurrentForVehicle", () => {
    it("should return current responsible for vehicle", async () => {
      const mock = createMockVehicleResponsible();
      mockRepo.findCurrentByVehicle.mockResolvedValue(mock);

      const result = await service.getCurrentForVehicle("v1");

      expect(result).not.toBeNull();
      expect(result?.vehicle.id).toBe("v1");
    });
  });

  describe("getCurrentForUser", () => {
    it("should return all current vehicles for user", async () => {
      const mockData = [createMockVehicleResponsible()];
      mockRepo.findCurrentForUser.mockResolvedValue(mockData);

      const result = await service.getCurrentForUser("u1");

      expect(result).toHaveLength(1);
      expect(result[0].user.id).toBe("u1");
    });
  });

  describe("create", () => {
    it("should create a new vehicle responsible", async () => {
      const mockUser = { id: "u1", firstName: "John" } as User;
      const mockVehicle = { id: "v1", licensePlate: "ABC123" } as Vehicle;
      const mockCreated = createMockVehicleResponsible();

      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.getOverlap.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(mockCreated);
      mockRepo.save.mockResolvedValue(mockCreated);
      mockRepo.findDetailedById.mockResolvedValue(mockCreated);

      const result = await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("u1");
    });

    it("should return null if user not found", async () => {
      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue({} as Vehicle);
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: "2024-01-01",
      });

      expect(result).toBeNull();
    });

    it("should close previous open assignments when creating new one without endDate", async () => {
      const mockUser = { id: "u1", firstName: "John" } as User;
      const mockVehicle = { id: "v1", licensePlate: "ABC123" } as Vehicle;
      const mockCreated = createMockVehicleResponsible();
      const previousAssignment = {
        ...createMockVehicleResponsible(),
        id: "prev",
      };

      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockVehicleResponsibleRepo.find.mockResolvedValue([previousAssignment]);
      mockRepo.create.mockReturnValue(mockCreated);
      mockRepo.save.mockResolvedValue(mockCreated);
      mockRepo.findDetailedById.mockResolvedValue(mockCreated);

      await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: "2024-01-01",
      });

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "prev" }),
      );
    });
  });

  describe("update", () => {
    it("should update an existing vehicle responsible", async () => {
      const mockEntity = createMockVehicleResponsible();
      const mockUser = { id: "u2", firstName: "Jane" } as User;

      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      mockVehicleResponsibleRepo.findOne.mockResolvedValue(mockEntity);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockVehicleResponsibleRepo.find.mockResolvedValue([]);
      mockRepo.save.mockResolvedValue({ ...mockEntity, user: mockUser });
      mockRepo.findDetailedById.mockResolvedValue({
        ...mockEntity,
        user: mockUser,
      });

      const result = await service.update("1", { userId: "u2" });

      expect(result).not.toBeNull();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should return null if entity not found", async () => {
      mockVehicleResponsibleRepo.findOne.mockResolvedValue(null);

      const result = await service.update("999", { userId: "u2" });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a vehicle responsible", async () => {
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
