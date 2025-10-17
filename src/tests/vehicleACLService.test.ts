import { describe, it, expect, beforeEach } from "@jest/globals";
import { VehicleACLService } from "../services/vehicleACLService";
import { VehicleACL } from "../entities/VehicleACL";
import { PermissionType } from "../utils";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import { DeleteResult } from "typeorm";
import { VehicleACLRepository } from "../repositories/VehicleACLRepository";

// Mock VehicleACLRepository
class MockVehicleACLRepository {
  private acls: VehicleACL[] = [];
  private idCounter = 1;

  async findAndCount(opts?: {
    pagination?: { limit?: number; offset?: number };
    filters?: {
      userId?: string;
      vehicleId?: string;
      activeAt?: Date;
      permission?: PermissionType;
    };
    search?: string;
  }): Promise<[VehicleACL[], number]> {
    const { pagination, filters, search } = opts || {};
    const limit = pagination?.limit || 10;
    const offset = pagination?.offset || 0;
    let filtered = [...this.acls];

    // Apply search
    if (search) {
      filtered = filtered.filter(
        (acl) =>
          acl.user.id.toLowerCase().includes(search.toLowerCase()) ||
          acl.vehicle.id.toLowerCase().includes(search.toLowerCase()) ||
          acl.permission.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Apply filters
    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter((acl) => acl.user.id === filters.userId);
      }
      if (filters.vehicleId) {
        filtered = filtered.filter(
          (acl) => acl.vehicle.id === filters.vehicleId,
        );
      }
      if (filters.permission) {
        filtered = filtered.filter(
          (acl) => acl.permission === filters.permission,
        );
      }
      if (filters.activeAt) {
        filtered = filtered.filter(
          (acl) =>
            acl.startTime <= filters.activeAt! &&
            (!acl.endTime || acl.endTime > filters.activeAt!),
        );
      }
    }

    const paginated = filtered.slice(offset, offset + limit);
    return [paginated, filtered.length];
  }

  async findOne(id: string): Promise<VehicleACL | null> {
    return this.acls.find((acl) => acl.id === id) || null;
  }

  async getActiveACLsForUser(userId: string): Promise<VehicleACL[]> {
    const now = new Date();
    return this.acls.filter(
      (acl) =>
        acl.user.id === userId &&
        acl.startTime <= now &&
        (!acl.endTime || acl.endTime > now),
    );
  }

  create(
    data: Partial<VehicleACL> & { userId?: string; vehicleId?: string },
  ): VehicleACL {
    const acl = new VehicleACL();
    Object.assign(acl, data);
    // Map userId/vehicleId to user/vehicle relations
    if (data.userId) {
      const user = new User();
      user.id = data.userId;
      acl.user = user;
    }
    if (data.vehicleId) {
      const vehicle = new Vehicle();
      vehicle.id = data.vehicleId;
      acl.vehicle = vehicle;
    }
    return acl;
  }

  async save(entity: VehicleACL): Promise<VehicleACL> {
    const index = this.acls.findIndex((acl) => acl.id === entity.id);
    if (index >= 0) {
      this.acls[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `test-uuid-${this.idCounter++}`;
      }
      this.acls.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.acls.findIndex((acl) => acl.id === id);
    if (index >= 0) {
      this.acls.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  reset() {
    this.acls = [];
    this.idCounter = 1;
  }

  seedACLs(acls: VehicleACL[]) {
    this.acls = [...acls];
  }
}

describe("VehicleACLService", () => {
  let service: VehicleACLService;
  let mockRepo: MockVehicleACLRepository;

  beforeEach(() => {
    mockRepo = new MockVehicleACLRepository();
    service = new VehicleACLService(
      mockRepo as unknown as VehicleACLRepository,
    );
  });

  function createTestUser(id: string): User {
    const user = new User();
    user.id = id;
    return user;
  }

  function createTestVehicle(id: string): Vehicle {
    const vehicle = new Vehicle();
    vehicle.id = id;
    return vehicle;
  }

  function createTestACL(
    id: string,
    user: User,
    vehicle: Vehicle,
    permission: PermissionType,
    startTime: Date,
    endTime?: Date,
  ): VehicleACL {
    const acl = new VehicleACL();
    acl.id = id;
    acl.user = user;
    acl.vehicle = vehicle;
    acl.permission = permission;
    acl.startTime = startTime;
    acl.endTime = endTime || null;
    return acl;
  }

  describe("getAll", () => {
    it("should return all vehicle ACLs", async () => {
      const user1 = createTestUser("user1");
      const user2 = createTestUser("user2");
      const vehicle1 = createTestVehicle("vehicle1");
      const vehicle2 = createTestVehicle("vehicle2");
      const acls = [
        createTestACL(
          "1",
          user1,
          vehicle1,
          PermissionType.READ,
          new Date("2024-01-01"),
        ),
        createTestACL(
          "2",
          user2,
          vehicle2,
          PermissionType.DRIVER,
          new Date("2024-01-01"),
        ),
      ];
      mockRepo.seedACLs(acls);

      const result = await service.getAll();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by userId", async () => {
      const user1 = createTestUser("user1");
      const user2 = createTestUser("user2");
      const vehicle1 = createTestVehicle("vehicle1");
      const vehicle2 = createTestVehicle("vehicle2");
      const acls = [
        createTestACL(
          "1",
          user1,
          vehicle1,
          PermissionType.READ,
          new Date("2024-01-01"),
        ),
        createTestACL(
          "2",
          user2,
          vehicle2,
          PermissionType.DRIVER,
          new Date("2024-01-01"),
        ),
      ];
      mockRepo.seedACLs(acls);

      const result = await service.getAll({
        filters: { userId: "user1" },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].user.id).toBe("user1");
    });

    it("should filter by vehicleId", async () => {
      const user1 = createTestUser("user1");
      const user2 = createTestUser("user2");
      const vehicle1 = createTestVehicle("vehicle1");
      const acls = [
        createTestACL(
          "1",
          user1,
          vehicle1,
          PermissionType.READ,
          new Date("2024-01-01"),
        ),
        createTestACL(
          "2",
          user2,
          vehicle1,
          PermissionType.DRIVER,
          new Date("2024-01-01"),
        ),
      ];
      mockRepo.seedACLs(acls);

      const result = await service.getAll({
        filters: { vehicleId: "vehicle1" },
      });

      expect(result.items).toHaveLength(2);
    });

    it("should filter active ACLs only", async () => {
      const user1 = createTestUser("user1");
      const user2 = createTestUser("user2");
      const vehicle1 = createTestVehicle("vehicle1");
      const vehicle2 = createTestVehicle("vehicle2");
      const past = new Date("2020-01-01");
      const future = new Date("2099-01-01");
      const acls = [
        createTestACL(
          "1",
          user1,
          vehicle1,
          PermissionType.READ,
          past,
          new Date("2020-12-31"),
        ),
        createTestACL(
          "2",
          user2,
          vehicle2,
          PermissionType.DRIVER,
          past,
          future,
        ),
      ];
      mockRepo.seedACLs(acls);

      const result = await service.getAll({
        filters: { activeAt: new Date() },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("2");
    });

    it("should apply pagination", async () => {
      const acls = Array.from({ length: 15 }, (_, i) => {
        const user = createTestUser(`user${i + 1}`);
        const vehicle = createTestVehicle(`vehicle${i + 1}`);
        return createTestACL(
          `${i + 1}`,
          user,
          vehicle,
          PermissionType.READ,
          new Date("2024-01-01"),
        );
      });
      mockRepo.seedACLs(acls);

      const result = await service.getAll({
        pagination: { limit: 10, offset: 10 },
      });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(15);
    });
  });

  describe("getById", () => {
    it("should return ACL by id", async () => {
      const user = createTestUser("user1");
      const vehicle = createTestVehicle("vehicle1");
      const acl = createTestACL(
        "1",
        user,
        vehicle,
        PermissionType.READ,
        new Date("2024-01-01"),
      );
      mockRepo.seedACLs([acl]);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
    });

    it("should return null if not found", async () => {
      const result = await service.getById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new vehicle ACL", async () => {
      const result = await service.create({
        userId: "user1",
        vehicleId: "vehicle1",
        permission: PermissionType.DRIVER,
        startTime: new Date("2024-01-01"),
      });

      expect(result).not.toBeNull();
      expect(result.user.id).toBe("user1");
      expect(result.permission).toBe(PermissionType.DRIVER);
    });

    it("should throw error if endTime before startTime", async () => {
      await expect(
        service.create({
          userId: "user1",
          vehicleId: "vehicle1",
          permission: PermissionType.DRIVER,
          startTime: new Date("2024-12-01"),
          endTime: new Date("2024-01-01"),
        }),
      ).rejects.toThrow("End time must be after start time");
    });
  });

  describe("update", () => {
    it("should update vehicle ACL", async () => {
      const user = createTestUser("user1");
      const vehicle = createTestVehicle("vehicle1");
      const acl = createTestACL(
        "1",
        user,
        vehicle,
        PermissionType.READ,
        new Date("2024-01-01"),
      );
      mockRepo.seedACLs([acl]);

      const result = await service.update("1", {
        permission: PermissionType.DRIVER,
      });

      expect(result).not.toBeNull();
      expect(result?.permission).toBe(PermissionType.DRIVER);
    });

    it("should return null if ACL not found", async () => {
      const result = await service.update("nonexistent", {
        permission: PermissionType.DRIVER,
      });
      expect(result).toBeNull();
    });

    it("should throw error if updating with invalid time range", async () => {
      const user = createTestUser("user1");
      const vehicle = createTestVehicle("vehicle1");
      const acl = createTestACL(
        "1",
        user,
        vehicle,
        PermissionType.READ,
        new Date("2024-01-01"),
      );
      mockRepo.seedACLs([acl]);

      await expect(
        service.update("1", {
          startTime: new Date("2024-12-01"),
          endTime: new Date("2024-01-01"),
        }),
      ).rejects.toThrow("End time must be after start time");
    });
  });

  describe("delete", () => {
    it("should delete vehicle ACL", async () => {
      const user = createTestUser("user1");
      const vehicle = createTestVehicle("vehicle1");
      const acl = createTestACL(
        "1",
        user,
        vehicle,
        PermissionType.READ,
        new Date("2024-01-01"),
      );
      mockRepo.seedACLs([acl]);

      const result = await service.delete("1");

      expect(result).toBe(true);
    });

    it("should return false if not found", async () => {
      const result = await service.delete("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("getActiveACLsForUser", () => {
    it("should return active ACLs for user", async () => {
      const user1 = createTestUser("user1");
      const user2 = createTestUser("user2");
      const vehicle1 = createTestVehicle("vehicle1");
      const vehicle2 = createTestVehicle("vehicle2");
      const vehicle3 = createTestVehicle("vehicle3");
      const past = new Date("2020-01-01");
      const future = new Date("2099-01-01");
      const acls = [
        createTestACL(
          "1",
          user1,
          vehicle1,
          PermissionType.READ,
          past,
          new Date("2020-12-31"),
        ),
        createTestACL(
          "2",
          user1,
          vehicle2,
          PermissionType.DRIVER,
          past,
          future,
        ),
        createTestACL("3", user2, vehicle3, PermissionType.READ, past, future),
      ];
      mockRepo.seedACLs(acls);

      const result = await service.getActiveACLsForUser("user1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });

    it("should return empty array if no active ACLs", async () => {
      const result = await service.getActiveACLsForUser("nonexistent");
      expect(result).toHaveLength(0);
    });
  });
});
