import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { UsersService } from "services/usersService";
import { IUserRepository } from "repositories/interfaces/IUserRepository";
import { User } from "entities/User";
import { DeleteResult } from "typeorm";

class MockUserRepository implements IUserRepository {
  private users: User[] = [];
  private idCounter = 1;

  async findAndCount(opts?: {
    pagination?: { limit?: number; offset?: number };
    filters?: Record<string, string>;
    search?: string;
  }): Promise<[User[], number]> {
    const { pagination, filters, search } = opts || {};
    const limit = pagination?.limit || 10;
    const offset = pagination?.offset || 0;
    let filtered = [...this.users];

    // Apply search
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(search.toLowerCase()) ||
          u.lastName.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.cuit && u.cuit.includes(search)),
      );
    }

    // Apply filters
    if (filters) {
      if (filters.email) {
        filtered = filtered.filter((u) => u.email === filters.email);
      }
      if (filters.firstName) {
        filtered = filtered.filter((u) =>
          u.firstName.toLowerCase().includes(filters.firstName.toLowerCase()),
        );
      }
      if (filters.lastName) {
        filtered = filtered.filter((u) =>
          u.lastName.toLowerCase().includes(filters.lastName.toLowerCase()),
        );
      }
      if (filters.active !== undefined) {
        const isActive = filters.active === "true";
        filtered = filtered.filter((u) => u.active === isActive);
      }
    }

    const paginated = filtered.slice(offset, offset + limit);
    return [paginated, filtered.length];
  }

  async findOne(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async findByEntraId(entraId: string): Promise<User | null> {
    return this.users.find((u) => u.entraId === entraId) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async findByCuit(cuit: string): Promise<User | null> {
    return this.users.find((u) => u.cuit === cuit) || null;
  }

  create(data: Partial<User>): User {
    const user = new User();
    Object.assign(user, data);
    return user;
  }

  async save(entity: User): Promise<User> {
    const index = this.users.findIndex((u) => u.id === entity.id);
    if (index >= 0) {
      this.users[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `test-uuid-${this.idCounter++}`;
      }
      this.users.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  reset() {
    this.users = [];
    this.idCounter = 1;
  }

  seedUsers(users: User[]) {
    this.users = [...users];
  }
}

describe("UsersService", () => {
  let service: UsersService;
  let mockRepo: MockUserRepository;

  beforeEach(() => {
    mockRepo = new MockUserRepository();
    service = new UsersService(mockRepo);
  });

  afterEach(() => {
    mockRepo.reset();
  });

  describe("getAll", () => {
    it("should return empty list when no users exist", async () => {
      const result = await service.getAll();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return all users with pagination", async () => {
      const users = [
        createTestUser("1", "John", "Doe", "john@test.com"),
        createTestUser("2", "Jane", "Smith", "jane@test.com"),
        createTestUser("3", "Bob", "Johnson", "bob@test.com"),
      ];
      mockRepo.seedUsers(users);

      const result = await service.getAll({
        pagination: { limit: 2, offset: 0 },
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.items[0].firstName).toBe("John");
      expect(result.items[1].firstName).toBe("Jane");
    });

    it("should filter users by search params", async () => {
      const users = [
        createTestUser("1", "John", "Doe", "john@test.com", true),
        createTestUser("2", "Jane", "Smith", "jane@test.com", false),
      ];
      mockRepo.seedUsers(users);

      const result = await service.getAll({
        filters: { active: "true" },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].firstName).toBe("John");
    });
  });

  describe("getById", () => {
    it("should return user when found", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com");
      mockRepo.seedUsers([user]);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("John");
    });

    it("should return null when user not found", async () => {
      const result = await service.getById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("getByEntraId", () => {
    it("should return user when found by entraId", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com");
      user.entraId = "entra-123";
      mockRepo.seedUsers([user]);

      const result = await service.getByEntraId("entra-123");

      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("John");
    });

    it("should return null when entraId not found", async () => {
      const result = await service.getByEntraId("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("getByEmail", () => {
    it("should return user when found by email", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com");
      mockRepo.seedUsers([user]);

      const result = await service.getByEmail("john@test.com");

      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("John");
    });

    it("should return null when email not found", async () => {
      const result = await service.getByEmail("nonexistent@test.com");
      expect(result).toBeNull();
    });
  });

  describe("getByCuit", () => {
    it("should return user when found by cuit", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com");
      user.cuit = "20-12345678-9";
      mockRepo.seedUsers([user]);

      const result = await service.getByCuit("20-12345678-9");

      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("John");
    });

    it("should return null when cuit not found", async () => {
      const result = await service.getByCuit("20-99999999-9");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new user with default active=true", async () => {
      const userData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        cuit: "20-12345678-9",
        active: true,
        entraId: "",
      };

      const result = await service.create(userData);

      expect(result).not.toBeNull();
      expect(result?.firstName).toBe("John");
      expect(result?.active).toBe(true);
    });

    it("should create a user with specified active status", async () => {
      const userData = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@test.com",
        cuit: "20-87654321-9",
        active: false,
        entraId: "",
      };

      const result = await service.create(userData);

      expect(result).not.toBeNull();
      expect(result?.active).toBe(false);
    });

    it("should create a user with entraId", async () => {
      const userData = {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob@test.com",
        cuit: "20-11111111-1",
        active: true,
        entraId: "entra-456",
      };

      const result = await service.create(userData);

      expect(result).not.toBeNull();
      expect(result?.entraId).toBe("entra-456");
    });
  });

  describe("update", () => {
    it("should update existing user", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com");
      mockRepo.seedUsers([user]);

      const updated = await service.update("1", {
        firstName: "Johnny",
        lastName: "Updated",
      });

      expect(updated).not.toBeNull();
      expect(updated?.firstName).toBe("Johnny");
      expect(updated?.lastName).toBe("Updated");
      expect(updated?.email).toBe("john@test.com");
    });

    it("should return null when user not found", async () => {
      const result = await service.update("non-existent", {
        firstName: "Test",
      });
      expect(result).toBeNull();
    });

    it("should handle partial updates", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com");
      mockRepo.seedUsers([user]);

      const updated = await service.update("1", { email: "newemail@test.com" });

      expect(updated?.firstName).toBe("John");
      expect(updated?.email).toBe("newemail@test.com");
    });
  });

  describe("delete", () => {
    it("should delete existing user and return true", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com");
      mockRepo.seedUsers([user]);

      const result = await service.delete("1");

      expect(result).toBe(true);
      const checkDeleted = await service.getById("1");
      expect(checkDeleted).toBeNull();
    });

    it("should return false when user not found", async () => {
      const result = await service.delete("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("activate", () => {
    it("should activate an inactive user", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com", false);
      mockRepo.seedUsers([user]);

      const result = await service.activate("1");

      expect(result).not.toBeNull();
      expect(result?.active).toBe(true);
    });

    it("should throw error when user is already active", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com", true);
      mockRepo.seedUsers([user]);

      await expect(service.activate("1")).rejects.toThrow("ALREADY_ACTIVE");
    });

    it("should return null when user not found", async () => {
      const result = await service.activate("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("deactivate", () => {
    it("should deactivate an active user", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com", true);
      mockRepo.seedUsers([user]);

      const result = await service.deactivate("1");

      expect(result).not.toBeNull();
      expect(result?.active).toBe(false);
    });

    it("should throw error when user is already inactive", async () => {
      const user = createTestUser("1", "John", "Doe", "john@test.com", false);
      mockRepo.seedUsers([user]);

      await expect(service.deactivate("1")).rejects.toThrow("ALREADY_INACTIVE");
    });

    it("should return null when user not found", async () => {
      const result = await service.deactivate("non-existent");
      expect(result).toBeNull();
    });
  });
});

function createTestUser(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  active: boolean = true,
): User {
  const user = new User();
  user.id = id;
  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  user.cuit = `20-${id.padStart(8, "0")}-9`;
  user.active = active;
  user.entraId = "";
  return user;
}
