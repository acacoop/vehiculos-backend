import { describe, it, expect, beforeEach } from "@jest/globals";
import { UserRolesService } from "@/services/userRolesService";
import { UserRole } from "@/entities/UserRole";
import { User } from "@/entities/User";
import { UserRoleEnum } from "@/utils";
import { DeleteResult, Repository } from "typeorm";

// Mock UserRoleRepository
class MockUserRoleRepository {
  private userRoles: UserRole[] = [];
  private idCounter = 1;

  async findAndCount(opts?: {
    pagination?: { limit?: number; offset?: number };
    filters?: {
      userId?: string;
      role?: UserRoleEnum;
      activeOnly?: boolean;
    };
    search?: string;
  }): Promise<[UserRole[], number]> {
    const { pagination, filters, search } = opts || {};
    const limit = pagination?.limit || 10;
    const offset = pagination?.offset || 0;
    let filtered = [...this.userRoles];

    // Apply search
    if (search) {
      filtered = filtered.filter(
        (ur) =>
          ur.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
          ur.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
          ur.user.email.toLowerCase().includes(search.toLowerCase()) ||
          ur.role.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Apply filters
    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter((ur) => ur.user.id === filters.userId);
      }
      if (filters.role) {
        filtered = filtered.filter((ur) => ur.role === filters.role);
      }
      if (filters.activeOnly) {
        const now = new Date();
        filtered = filtered.filter(
          (ur) => ur.startTime <= now && (!ur.endTime || ur.endTime > now),
        );
      }
    }

    const paginated = filtered.slice(offset, offset + limit);
    return [paginated, filtered.length];
  }

  async findOne(id: string): Promise<UserRole | null> {
    return this.userRoles.find((ur) => ur.id === id) || null;
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    return this.userRoles.filter((ur) => ur.user.id === userId);
  }

  async findActiveByUserId(userId: string): Promise<UserRole | null> {
    const now = new Date();
    return (
      this.userRoles.find(
        (ur) =>
          ur.user.id === userId &&
          ur.startTime <= now &&
          (!ur.endTime || ur.endTime > now),
      ) || null
    );
  }

  create(data: Partial<UserRole>): UserRole {
    const userRole = new UserRole();
    Object.assign(userRole, data);
    return userRole;
  }

  async save(entity: UserRole): Promise<UserRole> {
    const index = this.userRoles.findIndex((ur) => ur.id === entity.id);
    if (index >= 0) {
      this.userRoles[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `test-uuid-${this.idCounter++}`;
      }
      this.userRoles.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.userRoles.findIndex((ur) => ur.id === id);
    if (index >= 0) {
      this.userRoles.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  async endRole(id: string, endTime?: Date): Promise<UserRole | null> {
    const userRole = this.userRoles.find((ur) => ur.id === id);
    if (userRole) {
      userRole.endTime = endTime || new Date();
      return userRole;
    }
    return null;
  }

  reset() {
    this.userRoles = [];
    this.idCounter = 1;
  }

  seedUserRoles(userRoles: UserRole[]) {
    this.userRoles = [...userRoles];
  }
}

// Mock User Repository
class MockUserRepository {
  private users: User[] = [];

  async findOne(opts: { where: { id: string } }): Promise<User | null> {
    return this.users.find((u) => u.id === opts.where.id) || null;
  }

  seedUsers(users: User[]) {
    this.users = [...users];
  }

  reset() {
    this.users = [];
  }
}

describe("UserRolesService", () => {
  let service: UserRolesService;
  let mockUserRoleRepo: MockUserRoleRepository;
  let mockUserRepo: MockUserRepository;

  beforeEach(() => {
    mockUserRoleRepo = new MockUserRoleRepository();
    mockUserRepo = new MockUserRepository();
    service = new UserRolesService(
      mockUserRoleRepo as any,
      mockUserRepo as any as Repository<User>,
    );
  });

  function createTestUser(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
  ): User {
    const user = new User();
    user.id = id;
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.active = true;
    return user;
  }

  function createTestUserRole(
    id: string,
    user: User,
    role: UserRoleEnum,
    startTime: Date,
    endTime?: Date,
  ): UserRole {
    const userRole = new UserRole();
    userRole.id = id;
    userRole.user = user;
    userRole.role = role;
    userRole.startTime = startTime;
    userRole.endTime = endTime;
    return userRole;
  }

  describe("getAll", () => {
    it("should return all user roles", async () => {
      const user = createTestUser("1", "test@test.com", "John", "Doe");
      const userRoles = [
        createTestUserRole(
          "1",
          user,
          UserRoleEnum.USER,
          new Date("2024-01-01"),
        ),
        createTestUserRole(
          "2",
          user,
          UserRoleEnum.ADMIN,
          new Date("2024-06-01"),
        ),
      ];
      mockUserRoleRepo.seedUserRoles(userRoles);

      const result = await service.getAll();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by userId", async () => {
      const user1 = createTestUser("1", "user1@test.com", "John", "Doe");
      const user2 = createTestUser("2", "user2@test.com", "Jane", "Smith");
      const userRoles = [
        createTestUserRole(
          "1",
          user1,
          UserRoleEnum.USER,
          new Date("2024-01-01"),
        ),
        createTestUserRole(
          "2",
          user2,
          UserRoleEnum.ADMIN,
          new Date("2024-01-01"),
        ),
      ];
      mockUserRoleRepo.seedUserRoles(userRoles);

      const result = await service.getAll({ filters: { userId: "1" } });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].userId).toBe("1");
    });

    it("should filter by activeOnly", async () => {
      const user = createTestUser("1", "test@test.com", "John", "Doe");
      const past = new Date("2020-01-01");
      const future = new Date("2099-01-01");
      const userRoles = [
        createTestUserRole(
          "1",
          user,
          UserRoleEnum.USER,
          past,
          new Date("2020-12-31"),
        ),
        createTestUserRole("2", user, UserRoleEnum.ADMIN, past, future),
      ];
      mockUserRoleRepo.seedUserRoles(userRoles);

      const result = await service.getAll({ filters: { activeOnly: true } });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role).toBe(UserRoleEnum.ADMIN);
    });
  });

  describe("getById", () => {
    it("should return user role by id", async () => {
      const user = createTestUser("1", "test@test.com", "John", "Doe");
      const userRole = createTestUserRole(
        "1",
        user,
        UserRoleEnum.USER,
        new Date("2024-01-01"),
      );
      mockUserRoleRepo.seedUserRoles([userRole]);

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
    it("should create a new user role", async () => {
      const user = createTestUser("1", "test@test.com", "John", "Doe");
      mockUserRepo.seedUsers([user]);

      const result = await service.create({
        userId: "1",
        role: UserRoleEnum.ADMIN,
        startTime: new Date("2024-01-01"),
      });

      expect(result).not.toBeNull();
      expect(result.role).toBe(UserRoleEnum.ADMIN);
      expect(result.userId).toBe("1");
    });

    it("should throw error if user not found", async () => {
      await expect(
        service.create({
          userId: "nonexistent",
          role: UserRoleEnum.ADMIN,
          startTime: new Date(),
        }),
      ).rejects.toThrow("User not found");
    });

    it("should throw error if endTime before startTime", async () => {
      const user = createTestUser("1", "test@test.com", "John", "Doe");
      mockUserRepo.seedUsers([user]);

      await expect(
        service.create({
          userId: "1",
          role: UserRoleEnum.ADMIN,
          startTime: new Date("2024-12-01"),
          endTime: new Date("2024-01-01"),
        }),
      ).rejects.toThrow("End time must be after start time");
    });
  });

  describe("update", () => {
    it("should update user role", async () => {
      const user = createTestUser("1", "test@test.com", "John", "Doe");
      const userRole = createTestUserRole(
        "1",
        user,
        UserRoleEnum.USER,
        new Date("2024-01-01"),
      );
      mockUserRoleRepo.seedUserRoles([userRole]);

      const result = await service.update("1", { role: UserRoleEnum.ADMIN });

      expect(result).not.toBeNull();
      expect(result?.role).toBe(UserRoleEnum.ADMIN);
    });

    it("should return null if user role not found", async () => {
      const result = await service.update("nonexistent", {
        role: UserRoleEnum.ADMIN,
      });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete user role", async () => {
      const user = createTestUser("1", "test@test.com", "John", "Doe");
      const userRole = createTestUserRole(
        "1",
        user,
        UserRoleEnum.USER,
        new Date("2024-01-01"),
      );
      mockUserRoleRepo.seedUserRoles([userRole]);

      const result = await service.delete("1");

      expect(result).toBe(true);
    });

    it("should return false if not found", async () => {
      const result = await service.delete("nonexistent");
      expect(result).toBe(false);
    });
  });
});
