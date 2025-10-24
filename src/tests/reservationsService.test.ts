import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { ReservationsService } from "@/services/reservationsService";
import { IReservationRepository } from "@/repositories/interfaces/IReservationRepository";
import { Reservation } from "@/entities/Reservation";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { Repository, SelectQueryBuilder } from "typeorm";
import * as validators from "@/utils/validation/entity";

jest.mock("../utils/validation/entity");

describe("ReservationsService", () => {
  let service: ReservationsService;
  let mockReservationRepo: jest.Mocked<IReservationRepository>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockVehicleRepo: jest.Mocked<Repository<Vehicle>>;

  beforeEach(() => {
    mockReservationRepo = {
      findAndCount: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      distinctVehicleIdsByAssignedUser: jest.fn(),
      findByVehicleIds: jest.fn(),
      qb: jest.fn(),
    } as unknown as jest.Mocked<IReservationRepository>;

    mockUserRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    mockVehicleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

    service = new ReservationsService(
      mockReservationRepo,
      mockUserRepo,
      mockVehicleRepo,
    );
  });

  const createMockReservation = (): Reservation =>
    ({
      id: "1",
      startDate: "2024-01-01",
      endDate: "2024-01-05",
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
    }) as Reservation;

  describe("getAll", () => {
    it("should return paginated reservations", async () => {
      const mockReservations = [createMockReservation()];
      mockReservationRepo.findAndCount.mockResolvedValue([mockReservations, 1]);

      const result = await service.getAll({
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("1");
    });

    it("should handle empty results", async () => {
      mockReservationRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getAll();

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("should return reservation by id", async () => {
      const mockReservation = createMockReservation();
      mockReservationRepo.findOne.mockResolvedValue(mockReservation);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
    });

    it("should return null if reservation not found", async () => {
      mockReservationRepo.findOne.mockResolvedValue(null);

      const result = await service.getById("999");

      expect(result).toBeNull();
    });
  });

  describe("getByUserId", () => {
    it("should return reservations by user id", async () => {
      const mockReservations = [createMockReservation()];
      mockReservationRepo.find.mockResolvedValue(mockReservations);

      const result = await service.getByUserId("u1");

      expect(result).toHaveLength(1);
      expect(result[0].user.id).toBe("u1");
    });
  });

  describe("getByVehicleId", () => {
    it("should return reservations by vehicle id", async () => {
      const mockReservations = [createMockReservation()];
      mockReservationRepo.find.mockResolvedValue(mockReservations);

      const result = await service.getByVehicleId("v1");

      expect(result).toHaveLength(1);
      expect(result[0].vehicle.id).toBe("v1");
    });
  });

  describe("getAssignedVehiclesReservations", () => {
    it("should return reservations for assigned vehicles", async () => {
      mockReservationRepo.distinctVehicleIdsByAssignedUser.mockResolvedValue([
        { vehicleId: "v1" },
      ]);
      const mockReservations = [createMockReservation()];
      mockReservationRepo.findByVehicleIds.mockResolvedValue(mockReservations);

      const result = await service.getAssignedVehiclesReservations("u1");

      expect(result).toHaveLength(1);
      expect(
        mockReservationRepo.distinctVehicleIdsByAssignedUser,
      ).toHaveBeenCalledWith("u1");
    });

    it("should return empty array if no assigned vehicles", async () => {
      mockReservationRepo.distinctVehicleIdsByAssignedUser.mockResolvedValue(
        [],
      );

      const result = await service.getAssignedVehiclesReservations("u1");

      expect(result).toHaveLength(0);
    });
  });

  describe("getTodayByUserId", () => {
    it("should return today reservations by user id", async () => {
      const mockReservations = [createMockReservation()];
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn<() => Promise<Reservation[]>>()
          .mockResolvedValue(mockReservations),
      } as unknown as SelectQueryBuilder<Reservation>;

      mockReservationRepo.qb.mockReturnValue(mockQb);

      const result = await service.getTodayByUserId("u1");

      expect(result).toHaveLength(1);
      expect(mockQb.where).toHaveBeenCalledWith("r.user.id = :userId", {
        userId: "u1",
      });
    });
  });

  describe("create", () => {
    it("should create a new reservation", async () => {
      const mockUser = { id: "u1", firstName: "John" } as User;
      const mockVehicle = { id: "v1", licensePlate: "ABC123" } as Vehicle;
      const mockCreated = createMockReservation();

      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockReservationRepo.create.mockReturnValue(mockCreated);
      mockReservationRepo.save.mockResolvedValue(mockCreated);

      // Mock no overlap
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn<() => Promise<Reservation | null>>()
          .mockResolvedValue(null),
      } as jest.Mocked<
        Pick<SelectQueryBuilder<Reservation>, "where" | "andWhere" | "getOne">
      >;
      mockReservationRepo.qb.mockReturnValue(
        mockQb as unknown as SelectQueryBuilder<Reservation>,
      );

      const result = await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-05"),
      });

      expect(result).not.toBeNull();
      expect(mockReservationRepo.create).toHaveBeenCalled();
      expect(mockReservationRepo.save).toHaveBeenCalled();
    });

    it("should return null if user not found", async () => {
      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockUserRepo.findOne.mockResolvedValue(null);
      mockVehicleRepo.findOne.mockResolvedValue({} as Vehicle);

      // Mock no overlap (not reached due to validation failure)
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn<() => Promise<Reservation | null>>()
          .mockResolvedValue(null),
      } as jest.Mocked<
        Pick<SelectQueryBuilder<Reservation>, "where" | "andWhere" | "getOne">
      >;
      mockReservationRepo.qb.mockReturnValue(
        mockQb as unknown as SelectQueryBuilder<Reservation>,
      );

      const result = await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-05"),
      });

      expect(result).toBeNull();
    });

    it("should return null if vehicle not found", async () => {
      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      mockUserRepo.findOne.mockResolvedValue({} as User);
      mockVehicleRepo.findOne.mockResolvedValue(null);

      // Mock no overlap (not reached due to validation failure)
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn<() => Promise<Reservation | null>>()
          .mockResolvedValue(null),
      } as jest.Mocked<
        Pick<SelectQueryBuilder<Reservation>, "where" | "andWhere" | "getOne">
      >;
      mockReservationRepo.qb.mockReturnValue(
        mockQb as unknown as SelectQueryBuilder<Reservation>,
      );

      const result = await service.create({
        userId: "u1",
        vehicleId: "v1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-05"),
      });

      expect(result).toBeNull();
    });

    it("should throw error if reservation overlaps with existing one", async () => {
      const existingReservation = createMockReservation();

      jest.spyOn(validators, "validateUserExists").mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);

      // Mock the query builder chain
      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn<() => Promise<Reservation | null>>()
          .mockResolvedValue(existingReservation),
      } as jest.Mocked<
        Pick<
          SelectQueryBuilder<Reservation>,
          "leftJoin" | "where" | "andWhere" | "getOne"
        >
      >;
      mockReservationRepo.qb.mockReturnValue(
        mockQb as unknown as SelectQueryBuilder<Reservation>,
      );

      await expect(
        service.create({
          userId: "u1",
          vehicleId: "v1",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-05"),
        }),
      ).rejects.toThrow("Vehicle already has a reservation overlapping");
    });
  });
});
