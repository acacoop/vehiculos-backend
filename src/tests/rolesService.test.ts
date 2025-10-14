import { describe, it, expect, beforeEach } from "@jest/globals";
import { RolesService } from "../services/rolesService";
import { IRolesRepository } from "../repositories/interfaces/IRolesRepository";
import { Role, CecoRange, PermissionType } from "../entities/Roles";
import { DeleteResult } from "typeorm";

class MockRolesRepository implements IRolesRepository {
  private roles: Role[] = [];
  private idCounter = 1;

  async findAndCount(opts?: {
    limit?: number;
    offset?: number;
    searchParams?: { permission?: string };
  }): Promise<[Role[], number]> {
    const { limit = 10, offset = 0, searchParams } = opts || {};
    let filtered = [...this.roles];

    if (searchParams?.permission) {
      filtered = filtered.filter(
        (r) => r.permission === searchParams.permission,
      );
    }

    const paginated = filtered.slice(offset, offset + limit);
    return [paginated, filtered.length];
  }

  async findOne(id: string): Promise<Role | null> {
    return this.roles.find((r) => r.id === id) || null;
  }

  create(data: Partial<Role>): Role {
    const role = new Role();
    Object.assign(role, data);
    return role;
  }

  async save(entity: Role): Promise<Role> {
    const index = this.roles.findIndex((r) => r.id === entity.id);
    if (index >= 0) {
      this.roles[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `role-uuid-${this.idCounter++}`;
      }
      // Assign IDs to cecoRanges if they don't have them
      if (entity.cecoRanges) {
        entity.cecoRanges = entity.cecoRanges.map((cr) => {
          if (!cr.id) {
            cr.id = `ceco-uuid-${this.idCounter++}`;
          }
          return cr;
        });
      }
      this.roles.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.roles.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.roles.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  reset() {
    this.roles = [];
    this.idCounter = 1;
  }

  seedRoles(roles: Role[]) {
    this.roles = [...roles];
  }
}

const createTestRole = (
  id: string,
  permission: PermissionType,
  cecoRanges?: CecoRange[],
): Role => {
  const role = new Role();
  role.id = id;
  role.permission = permission;
  role.cecoRanges = cecoRanges || [];
  role.vehicles = [];
  return role;
};

const createTestCecoRange = (
  id: string,
  startCeco: number,
  endCeco: number,
): CecoRange => {
  const range = new CecoRange();
  range.id = id;
  range.startCeco = startCeco;
  range.endCeco = endCeco;
  return range;
};

describe("RolesService", () => {
  let service: RolesService;
  let mockRepo: MockRolesRepository;

  beforeEach(() => {
    mockRepo = new MockRolesRepository();
    service = new RolesService(mockRepo);
  });

  describe("getAll", () => {
    it("should return all roles with cecoRanges", async () => {
      const cecoRange1 = createTestCecoRange("cr1", 10000000, 19999999);
      const cecoRange2 = createTestCecoRange("cr2", 20000000, 29999999);
      const role1 = createTestRole("1", PermissionType.FULL, [cecoRange1]);
      const role2 = createTestRole("2", PermissionType.DRIVER, [cecoRange2]);

      mockRepo.seedRoles([role1, role2]);

      const result = await service.getAll();

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].permission).toBe(PermissionType.FULL);
      expect(result.items[0].cecoRanges).toHaveLength(1);
      expect(result.items[0].cecoRanges![0].startCeco).toBe(10000000);
      expect(result.items[1].permission).toBe(PermissionType.DRIVER);
    });

    it("should return roles without cecoRanges", async () => {
      const role = createTestRole("1", PermissionType.READ);
      mockRepo.seedRoles([role]);

      const result = await service.getAll();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].cecoRanges).toEqual([]);
    });

    it("should support pagination", async () => {
      const roles = [
        createTestRole("1", PermissionType.FULL),
        createTestRole("2", PermissionType.DRIVER),
        createTestRole("3", PermissionType.READ),
      ];
      mockRepo.seedRoles(roles);

      const result = await service.getAll({ limit: 2, offset: 1 });

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe("2");
    });

    it("should filter by permission", async () => {
      const roles = [
        createTestRole("1", PermissionType.FULL),
        createTestRole("2", PermissionType.DRIVER),
        createTestRole("3", PermissionType.FULL),
      ];
      mockRepo.seedRoles(roles);

      const result = await service.getAll({
        searchParams: { permission: PermissionType.FULL },
      });

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(
        result.items.every((r) => r.permission === PermissionType.FULL),
      ).toBe(true);
    });

    it("should return empty array when no roles exist", async () => {
      const result = await service.getAll();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getById", () => {
    it("should return role by id with cecoRanges", async () => {
      const cecoRange = createTestCecoRange("cr1", 10000000, 19999999);
      const role = createTestRole("1", PermissionType.MAINTAINER, [cecoRange]);
      mockRepo.seedRoles([role]);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
      expect(result?.permission).toBe(PermissionType.MAINTAINER);
      expect(result?.cecoRanges).toHaveLength(1);
      expect(result?.cecoRanges![0].startCeco).toBe(10000000);
    });

    it("should return null when role not found", async () => {
      const result = await service.getById("non-existent");

      expect(result).toBeNull();
    });

    it("should handle role without cecoRanges", async () => {
      const role = createTestRole("1", PermissionType.READ);
      mockRepo.seedRoles([role]);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.cecoRanges).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a role without cecoRanges", async () => {
      const result = await service.create({
        permission: PermissionType.DRIVER,
      });

      expect(result.id).toBeDefined();
      expect(result.permission).toBe(PermissionType.DRIVER);
      expect(result.cecoRanges).toBeUndefined();
    });

    it("should create a role with single cecoRange", async () => {
      const result = await service.create({
        permission: PermissionType.FULL,
        cecoRanges: [{ startCeco: 10000000, endCeco: 19999999 }],
      });

      expect(result.id).toBeDefined();
      expect(result.permission).toBe(PermissionType.FULL);
      expect(result.cecoRanges).toHaveLength(1);
      expect(result.cecoRanges![0].id).toBeDefined();
      expect(result.cecoRanges![0].startCeco).toBe(10000000);
      expect(result.cecoRanges![0].endCeco).toBe(19999999);
    });

    it("should create a role with multiple cecoRanges", async () => {
      const result = await service.create({
        permission: PermissionType.MAINTAINER,
        cecoRanges: [
          { startCeco: 10000000, endCeco: 19999999 },
          { startCeco: 20000000, endCeco: 29999999 },
          { startCeco: 30000000, endCeco: 39999999 },
        ],
      });

      expect(result.cecoRanges).toHaveLength(3);
      expect(result.cecoRanges![1].startCeco).toBe(20000000);
    });

    it("should create role with empty cecoRanges array", async () => {
      const result = await service.create({
        permission: PermissionType.READ,
        cecoRanges: [],
      });

      expect(result.permission).toBe(PermissionType.READ);
      expect(result.cecoRanges).toBeUndefined();
    });

    it("should create multiple roles with different permissions", async () => {
      const role1 = await service.create({ permission: PermissionType.FULL });
      const role2 = await service.create({ permission: PermissionType.DRIVER });

      expect(role1.id).not.toBe(role2.id);
      expect(role1.permission).toBe(PermissionType.FULL);
      expect(role2.permission).toBe(PermissionType.DRIVER);
    });
  });

  describe("update", () => {
    it("should update role permission", async () => {
      const role = createTestRole("1", PermissionType.READ);
      mockRepo.seedRoles([role]);

      const result = await service.update("1", {
        permission: PermissionType.FULL,
      });

      expect(result).not.toBeNull();
      expect(result?.permission).toBe(PermissionType.FULL);
    });

    it("should update role cecoRanges", async () => {
      const cecoRange = createTestCecoRange("cr1", 10000000, 19999999);
      const role = createTestRole("1", PermissionType.FULL, [cecoRange]);
      mockRepo.seedRoles([role]);

      const result = await service.update("1", {
        cecoRanges: [
          { startCeco: 20000000, endCeco: 29999999 },
          { startCeco: 30000000, endCeco: 39999999 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result?.cecoRanges).toHaveLength(2);
      expect(result?.cecoRanges![0].startCeco).toBe(20000000);
      expect(result?.cecoRanges![1].startCeco).toBe(30000000);
    });

    it("should update both permission and cecoRanges", async () => {
      const role = createTestRole("1", PermissionType.READ);
      mockRepo.seedRoles([role]);

      const result = await service.update("1", {
        permission: PermissionType.DRIVER,
        cecoRanges: [{ startCeco: 10000000, endCeco: 19999999 }],
      });

      expect(result).not.toBeNull();
      expect(result?.permission).toBe(PermissionType.DRIVER);
      expect(result?.cecoRanges).toHaveLength(1);
    });

    it("should clear cecoRanges when updated with empty array", async () => {
      const cecoRange = createTestCecoRange("cr1", 10000000, 19999999);
      const role = createTestRole("1", PermissionType.FULL, [cecoRange]);
      mockRepo.seedRoles([role]);

      const result = await service.update("1", {
        cecoRanges: [],
      });

      expect(result).not.toBeNull();
      expect(result?.cecoRanges).toEqual([]);
    });

    it("should return null when updating non-existent role", async () => {
      const result = await service.update("non-existent", {
        permission: PermissionType.FULL,
      });

      expect(result).toBeNull();
    });

    it("should preserve existing cecoRange id when updating", async () => {
      const cecoRange = createTestCecoRange("cr1", 10000000, 19999999);
      const role = createTestRole("1", PermissionType.FULL, [cecoRange]);
      mockRepo.seedRoles([role]);

      const result = await service.update("1", {
        cecoRanges: [{ id: "cr1", startCeco: 15000000, endCeco: 25000000 }],
      });

      expect(result?.cecoRanges![0].id).toBe("cr1");
      expect(result?.cecoRanges![0].startCeco).toBe(15000000);
    });
  });

  describe("delete", () => {
    it("should delete existing role", async () => {
      const role = createTestRole("1", PermissionType.DRIVER);
      mockRepo.seedRoles([role]);

      const result = await service.delete("1");

      expect(result).toBe(true);
      const checkDeleted = await service.getById("1");
      expect(checkDeleted).toBeNull();
    });

    it("should return false when deleting non-existent role", async () => {
      const result = await service.delete("non-existent");

      expect(result).toBe(false);
    });

    it("should delete role with cecoRanges", async () => {
      const cecoRange = createTestCecoRange("cr1", 10000000, 19999999);
      const role = createTestRole("1", PermissionType.FULL, [cecoRange]);
      mockRepo.seedRoles([role]);

      const result = await service.delete("1");

      expect(result).toBe(true);
    });

    it("should handle deletion of multiple roles", async () => {
      const roles = [
        createTestRole("1", PermissionType.FULL),
        createTestRole("2", PermissionType.DRIVER),
        createTestRole("3", PermissionType.READ),
      ];
      mockRepo.seedRoles(roles);

      await service.delete("2");
      const remaining = await service.getAll();

      expect(remaining.total).toBe(2);
      expect(remaining.items.find((r) => r.id === "2")).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle cecoRanges with same start and end", async () => {
      const result = await service.create({
        permission: PermissionType.FULL,
        cecoRanges: [{ startCeco: 10000000, endCeco: 10000000 }],
      });

      expect(result.cecoRanges![0].startCeco).toBe(10000000);
      expect(result.cecoRanges![0].endCeco).toBe(10000000);
    });

    it("should handle very large ceco numbers", async () => {
      const result = await service.create({
        permission: PermissionType.DRIVER,
        cecoRanges: [{ startCeco: 99999999, endCeco: 99999999 }],
      });

      expect(result.cecoRanges![0].startCeco).toBe(99999999);
    });

    it("should handle role update with no changes", async () => {
      const role = createTestRole("1", PermissionType.READ);
      mockRepo.seedRoles([role]);

      const result = await service.update("1", {});

      expect(result).not.toBeNull();
      expect(result?.permission).toBe(PermissionType.READ);
    });
  });
});
