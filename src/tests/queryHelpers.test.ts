import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SelectQueryBuilder, Brackets } from "typeorm";
import {
  applySearchFilter,
  applyFilters,
  applyOverlapCheck,
} from "@/utils/index";

// Mock entity for testing
class TestEntity {
  id!: string;
  name!: string;
  email!: string;
  active!: boolean;
  age!: number;
  createdAt!: Date;
}

// Mock query builder
function createMockQueryBuilder(): jest.Mocked<SelectQueryBuilder<TestEntity>> {
  const whereClauses: string[] = [];
  const parameters: Record<string, unknown> = {};

  const mock = {
    where: jest.fn((condition: string, params?: Record<string, unknown>) => {
      whereClauses.push(condition);
      if (params) Object.assign(parameters, params);
      return mock;
    }),
    andWhere: jest.fn(
      (condition: string | Brackets, params?: Record<string, unknown>) => {
        if (typeof condition === "string") {
          whereClauses.push(`AND ${condition}`);
        } else if (condition instanceof Brackets) {
          // Execute the bracket function to capture nested conditions
          const nestedQb = createMockQueryBuilder();
          condition.whereFactory(nestedQb as never);
          whereClauses.push(
            `AND (${nestedQb.getQuery().replace(/AND /g, "")})`,
          );
          Object.assign(parameters, nestedQb.getParameters());
        }
        if (params) Object.assign(parameters, params);
        return mock;
      },
    ),
    orWhere: jest.fn((condition: string, params?: Record<string, unknown>) => {
      whereClauses.push(`OR ${condition}`);
      if (params) Object.assign(parameters, params);
      return mock;
    }),
    skip: jest.fn(() => {
      whereClauses.push("SKIP");
      return mock;
    }),
    take: jest.fn(() => {
      whereClauses.push("LIMIT");
      return mock;
    }),
    getQuery: jest.fn(() => whereClauses.join(" ")),
    getParameters: jest.fn(() => parameters),
  } as unknown as jest.Mocked<SelectQueryBuilder<TestEntity>>;

  return mock;
}

describe("queryHelpers", () => {
  let qb: jest.Mocked<SelectQueryBuilder<TestEntity>>;

  beforeEach(() => {
    qb = createMockQueryBuilder();
  });

  describe("applySearchFilter", () => {
    it("should apply OR search filter across multiple fields", () => {
      applySearchFilter(qb, "john", ["entity.name", "entity.email"]);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("entity.name LIKE :search_term");
      expect(query).toContain("OR entity.email LIKE :search_term");
      expect(params.search_term).toBe("%john%");
    });

    it("should not apply filter when search is empty", () => {
      const originalQuery = qb.getQuery();
      applySearchFilter(qb, "", ["entity.name"]);

      expect(qb.getQuery()).toBe(originalQuery);
    });

    it("should not apply filter when fields array is empty", () => {
      const originalQuery = qb.getQuery();
      applySearchFilter(qb, "john", []);

      expect(qb.getQuery()).toBe(originalQuery);
    });

    it("should handle single field search", () => {
      applySearchFilter(qb, "test", ["entity.name"]);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("entity.name LIKE :search_term");
      expect(query).not.toContain("OR");
      expect(params.search_term).toBe("%test%");
    });

    it("should handle multiple fields search", () => {
      applySearchFilter(qb, "search term", [
        "entity.name",
        "entity.email",
        "entity.description",
      ]);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("entity.name LIKE :search_term");
      expect(query).toContain("OR entity.email LIKE :search_term");
      expect(query).toContain("OR entity.description LIKE :search_term");
      expect(params.search_term).toBe("%search term%");
    });

    it("should work with existing WHERE conditions", () => {
      qb.where("entity.active = :active", { active: true });
      applySearchFilter(qb, "john", ["entity.name", "entity.email"]);

      const query = qb.getQuery();

      expect(query).toContain("entity.active = :active");
      expect(query).toContain("entity.name LIKE :search_term");
      expect(query).toContain("AND");
    });

    it("should concatenate fields when passed as array", () => {
      applySearchFilter(qb, "john doe", [
        ["entity.firstName", "entity.lastName"],
      ]);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain(
        "CONCAT(entity.firstName, ' ', entity.lastName) LIKE :search_term",
      );
      expect(params.search_term).toBe("%john doe%");
    });
  });

  describe("applyFilters", () => {
    interface TestFilters {
      name?: string;
      email?: string;
      active?: string;
      age?: string;
      minAge?: string;
    }

    it("should apply exact match filter", () => {
      const filters: TestFilters = { email: "john@test.com" };
      const mappings = {
        email: { field: "entity.email" },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("entity.email = :email");
      expect(params.email).toBe("john@test.com");
    });

    it("should apply LIKE filter", () => {
      const filters: TestFilters = { name: "John" };
      const mappings = {
        name: { field: "entity.name", operator: "LIKE" as const },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("entity.name LIKE :name");
      expect(params.name).toBe("%John%");
    });

    it("should apply comparison operators", () => {
      const filters: TestFilters = { minAge: "18" };
      const mappings = {
        minAge: {
          field: "entity.age",
          operator: ">=" as const,
          transform: (v: string | undefined) => (v ? Number(v) : undefined),
        },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("entity.age >= :minAge");
      expect(params.minAge).toBe(18);
    });

    it("should apply transform function", () => {
      const filters: TestFilters = { active: "true" };
      const mappings = {
        active: {
          field: "entity.active",
          transform: (v: string | undefined) => v === "true",
        },
      };

      applyFilters(qb, filters, mappings);

      const params = qb.getParameters();
      expect(params.active).toBe(true);
    });

    it("should handle multiple filters", () => {
      const filters: TestFilters = {
        name: "John",
        email: "john@test.com",
        active: "true",
      };
      const mappings = {
        name: { field: "entity.name", operator: "LIKE" as const },
        email: { field: "entity.email" },
        active: {
          field: "entity.active",
          transform: (v: string | undefined) => v === "true",
        },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("entity.name LIKE :name");
      expect(query).toContain("entity.email = :email");
      expect(query).toContain("entity.active = :active");
      expect(params.name).toBe("%John%");
      expect(params.email).toBe("john@test.com");
      expect(params.active).toBe(true);
    });

    it("should skip undefined and null values", () => {
      const filters: TestFilters = {
        name: "John",
        email: undefined,
      };
      const mappings = {
        name: { field: "entity.name" },
        email: { field: "entity.email" },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();

      expect(query).toContain("entity.name = :name");
      expect(query).not.toContain("entity.email");
    });

    it("should skip filters without mappings", () => {
      const filters: TestFilters = {
        name: "John",
        email: "john@test.com",
      };
      const mappings = {
        name: { field: "entity.name" },
        // email mapping intentionally omitted
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();

      expect(query).toContain("entity.name = :name");
      expect(query).not.toContain("email");
    });

    it("should handle empty filters object", () => {
      const originalQuery = qb.getQuery();
      applyFilters(qb, {}, {});

      expect(qb.getQuery()).toBe(originalQuery);
    });

    it("should handle undefined filters", () => {
      const originalQuery = qb.getQuery();
      const mappings: Record<string, { field: string }> = {
        name: { field: "entity.name" },
      };
      applyFilters<TestEntity, TestFilters>(
        qb,
        undefined as unknown as TestFilters,
        mappings,
      );

      expect(qb.getQuery()).toBe(originalQuery);
    });

    it("should sanitize parameter names with dots", () => {
      const filters = { "user.name": "John" };
      const mappings = {
        "user.name": { field: "entity.name" },
      };

      applyFilters(qb, filters, mappings);

      const params = qb.getParameters();

      expect(params.user_name).toBe("John");
    });

    it("should work with existing WHERE conditions", () => {
      qb.where("entity.id = :id", { id: "123" });

      const filters: TestFilters = { name: "John" };
      const mappings = { name: { field: "entity.name" } };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();

      expect(query).toContain("entity.id = :id");
      expect(query).toContain("entity.name = :name");
      expect(query).toContain("AND");
    });

    it("should support > operator", () => {
      const filters = { age: "25" };
      const mappings = {
        age: {
          field: "entity.age",
          operator: ">" as const,
          transform: (v: string | undefined) => (v ? Number(v) : undefined),
        },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      expect(query).toContain("entity.age > :age");
      expect(qb.getParameters().age).toBe(25);
    });

    it("should support < operator", () => {
      const filters = { age: "30" };
      const mappings = {
        age: {
          field: "entity.age",
          operator: "<" as const,
          transform: (v: string | undefined) => (v ? Number(v) : undefined),
        },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      expect(query).toContain("entity.age < :age");
      expect(qb.getParameters().age).toBe(30);
    });

    it("should support <= operator", () => {
      const filters = { age: "30" };
      const mappings = {
        age: {
          field: "entity.age",
          operator: "<=" as const,
          transform: (v: string | undefined) => (v ? Number(v) : undefined),
        },
      };

      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      expect(query).toContain("entity.age <= :age");
      expect(qb.getParameters().age).toBe(30);
    });
  });

  describe("combined usage", () => {
    it("should combine search and filters", () => {
      interface TestFilters {
        email?: string;
        active?: string;
      }

      const filters: TestFilters = {
        email: "john@test.com",
        active: "true",
      };

      const mappings = {
        email: { field: "entity.email" },
        active: {
          field: "entity.active",
          transform: (v: string | undefined) => v === "true",
        },
      };

      // Apply search
      applySearchFilter(qb, "john", ["entity.name", "entity.email"]);

      // Apply filters
      applyFilters(qb, filters, mappings);

      const query = qb.getQuery();
      const params = qb.getParameters();

      // Check all conditions are present
      expect(query).toContain("entity.name LIKE :search_term");
      expect(query).toContain("entity.email = :email");
      expect(query).toContain("entity.active = :active");

      // Check parameters
      expect(params.search_term).toBe("%john%");
      expect(params.email).toBe("john@test.com");
      expect(params.active).toBe(true);
    });

    it("should work with pagination", () => {
      applySearchFilter(qb, "john", ["entity.name"]);
      applyFilters(
        qb,
        { active: "true" },
        {
          active: {
            field: "entity.active",
            transform: (v: string | undefined) => v === "true",
          },
        },
      );

      qb.skip(10).take(20);

      const query = qb.getQuery();

      expect(query).toContain("entity.name LIKE :search_term");
      expect(query).toContain("entity.active = :active");
      expect(query).toContain("LIMIT");
    });
  });

  describe("applyOverlapCheck", () => {
    it("should apply overlap check query for vehicle reservations", () => {
      applyOverlapCheck(qb, {
        entityId: "vehicle-123",
        entityField: "r.vehicle.id",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
        startField: "r.startDate",
        endField: "r.endDate",
        idField: "r.id",
      });

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("r.vehicle.id = :entityId");
      expect(query).toContain(
        "(r.startDate < :endDate OR :endDate IS NULL) AND (r.endDate > :startDate OR r.endDate IS NULL)",
      );
      expect(params.entityId).toBe("vehicle-123");
      expect(params.startDate).toBe("2024-01-01");
      expect(params.endDate).toBe("2024-01-10");
    });

    it("should exclude specified ID when provided", () => {
      applyOverlapCheck(qb, {
        entityId: "vehicle-123",
        entityField: "r.vehicle.id",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
        excludeId: "exclude-456",
        startField: "r.startDate",
        endField: "r.endDate",
        idField: "r.id",
      });

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("r.id != :excludeId");
      expect(params.excludeId).toBe("exclude-456");
    });

    it("should handle null end date", () => {
      applyOverlapCheck(qb, {
        entityId: "vehicle-123",
        entityField: "r.vehicle.id",
        startDate: "2024-01-01",
        endDate: null,
        startField: "r.startDate",
        endField: "r.endDate",
        idField: "r.id",
      });

      const params = qb.getParameters();

      expect(params.startDate).toBe("2024-01-01");
      expect(params.endDate).toBeNull();
    });

    it("should use default field names when not specified", () => {
      applyOverlapCheck(qb, {
        entityId: "vehicle-123",
        entityField: "vehicle.id",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
      });

      const query = qb.getQuery();

      expect(query).toContain("vehicle.id = :entityId");
      expect(query).toContain(
        "(startDate < :endDate OR :endDate IS NULL) AND (endDate > :startDate OR endDate IS NULL)",
      );
    });

    it("should apply additional filters", () => {
      applyOverlapCheck(qb, {
        entityId: "user-123",
        entityField: "user.id",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
        additionalFilters: {
          "ur.role": "admin",
          "ur.status": "active",
        },
        startField: "ur.startTime",
        endField: "ur.endTime",
      });

      const query = qb.getQuery();
      const params = qb.getParameters();

      expect(query).toContain("user.id = :entityId");
      expect(query).toContain("ur.role = :ur_role");
      expect(query).toContain("ur.status = :ur_status");
      expect(params.entityId).toBe("user-123");
      expect(params.ur_role).toBe("admin");
      expect(params.ur_status).toBe("active");
    });
  });
});
