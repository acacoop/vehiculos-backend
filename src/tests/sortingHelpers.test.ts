import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SelectQueryBuilder } from "typeorm";
import {
  extractSorting,
  applySorting,
  SortFieldMapping,
} from "@/utils/query/sorting";

// Mock entity for testing
class TestEntity {
  id!: string;
  name!: string;
}

// Mock query builder
function createMockQueryBuilder(): jest.Mocked<SelectQueryBuilder<TestEntity>> {
  const orderByClauses: Array<{ column: string; order: string }> = [];

  const mock = {
    orderBy: jest.fn((column: string, order: string) => {
      orderByClauses.length = 0; // Clear previous orderBy (mimics TypeORM behavior)
      orderByClauses.push({ column, order });
      return mock;
    }),
    addOrderBy: jest.fn((column: string, order: string) => {
      orderByClauses.push({ column, order });
      return mock;
    }),
    getOrderByClauses: () => orderByClauses,
  } as unknown as jest.Mocked<SelectQueryBuilder<TestEntity>>;

  return mock;
}

describe("sortingHelpers", () => {
  describe("extractSorting", () => {
    it("should return undefined when no sortBy provided", () => {
      const result = extractSorting({});

      expect(result).toBeUndefined();
    });

    it("should return sortBy with undefined sortOrder when sortOrder not provided", () => {
      const result = extractSorting({ sortBy: "name" });

      expect(result).toEqual({
        sortBy: "name",
        sortOrder: undefined,
      });
    });

    it("should return uppercase ASC when sortOrder is lowercase", () => {
      const result = extractSorting({ sortBy: "name", sortOrder: "asc" });

      expect(result).toEqual({
        sortBy: "name",
        sortOrder: "ASC",
      });
    });

    it("should return uppercase DESC when sortOrder is lowercase", () => {
      const result = extractSorting({ sortBy: "name", sortOrder: "desc" });

      expect(result).toEqual({
        sortBy: "name",
        sortOrder: "DESC",
      });
    });

    it("should return undefined sortOrder for invalid sortOrder values", () => {
      const result = extractSorting({ sortBy: "name", sortOrder: "RANDOM" });

      expect(result).toEqual({
        sortBy: "name",
        sortOrder: undefined,
      });
    });

    it("should return undefined when sortBy is not in allowedSortFields", () => {
      const result = extractSorting({ sortBy: "invalidField" }, [
        "name",
        "email",
      ]);

      expect(result).toBeUndefined();
    });

    it("should return sorting when sortBy is in allowedSortFields", () => {
      const result = extractSorting({ sortBy: "name", sortOrder: "DESC" }, [
        "name",
        "email",
      ]);

      expect(result).toEqual({
        sortBy: "name",
        sortOrder: "DESC",
      });
    });

    it("should work without allowedSortFields (no validation)", () => {
      const result = extractSorting({ sortBy: "anyField", sortOrder: "ASC" });

      expect(result).toEqual({
        sortBy: "anyField",
        sortOrder: "ASC",
      });
    });

    it("should return undefined when sortBy is not a string", () => {
      const result = extractSorting({ sortBy: 123 });

      expect(result).toBeUndefined();
    });

    it("should ignore non-string sortOrder", () => {
      const result = extractSorting({ sortBy: "name", sortOrder: 123 });

      expect(result).toEqual({
        sortBy: "name",
        sortOrder: undefined,
      });
    });
  });

  describe("applySorting", () => {
    let qb: jest.Mocked<SelectQueryBuilder<TestEntity>>;
    const fieldMapping: SortFieldMapping = {
      name: "e.name",
      email: "e.email",
      brand: "b.name",
    };

    beforeEach(() => {
      qb = createMockQueryBuilder();
    });

    it("should return false when sorting is undefined", () => {
      const result = applySorting(qb, undefined, fieldMapping);

      expect(result).toBe(false);
      expect(qb.orderBy).not.toHaveBeenCalled();
    });

    it("should return false when sortBy is not provided", () => {
      const result = applySorting(qb, {}, fieldMapping);

      expect(result).toBe(false);
      expect(qb.orderBy).not.toHaveBeenCalled();
    });

    it("should return false when sortBy is not in fieldMapping", () => {
      const result = applySorting(qb, { sortBy: "invalidField" }, fieldMapping);

      expect(result).toBe(false);
      expect(qb.orderBy).not.toHaveBeenCalled();
    });

    it("should return true and apply ORDER BY when sortBy is valid", () => {
      const result = applySorting(qb, { sortBy: "name" }, fieldMapping);

      expect(result).toBe(true);
      expect(qb.orderBy).toHaveBeenCalledWith("e.name", "ASC");
    });

    it("should default sortOrder to ASC when not provided", () => {
      applySorting(qb, { sortBy: "email" }, fieldMapping);

      expect(qb.orderBy).toHaveBeenCalledWith("e.email", "ASC");
    });

    it("should use provided sortOrder", () => {
      applySorting(qb, { sortBy: "name", sortOrder: "DESC" }, fieldMapping);

      expect(qb.orderBy).toHaveBeenCalledWith("e.name", "DESC");
    });

    it("should apply both primary sort and tie-breaker when tieBreaker is provided", () => {
      applySorting(
        qb,
        { sortBy: "name", sortOrder: "DESC" },
        fieldMapping,
        "e.id",
      );

      expect(qb.orderBy).toHaveBeenCalledWith("e.name", "DESC");
      expect(qb.addOrderBy).toHaveBeenCalledWith("e.id", "ASC");
    });

    it("should not call addOrderBy when tieBreaker is not provided", () => {
      applySorting(qb, { sortBy: "name" }, fieldMapping);

      expect(qb.orderBy).toHaveBeenCalled();
      expect(qb.addOrderBy).not.toHaveBeenCalled();
    });

    it("should throw on invalid column path characters", () => {
      const maliciousMapping: SortFieldMapping = {
        name: "e.name; DROP TABLE users;--",
      };

      expect(() => {
        applySorting(qb, { sortBy: "name" }, maliciousMapping);
      }).toThrow("Invalid column path");
    });

    it("should throw on invalid tieBreaker characters", () => {
      expect(() => {
        applySorting(
          qb,
          { sortBy: "name" },
          fieldMapping,
          "e.id; DROP TABLE users;--",
        );
      }).toThrow("Invalid column path");
    });

    it("should allow valid column paths with dots and underscores", () => {
      const validMapping: SortFieldMapping = {
        name: "table_alias.column_name",
      };

      expect(() => {
        applySorting(qb, { sortBy: "name" }, validMapping, "t.id_field");
      }).not.toThrow();
    });
  });
});
