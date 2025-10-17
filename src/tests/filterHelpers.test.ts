import { describe, it, expect } from "@jest/globals";
import { extractFilters, extractSearch } from "../utils";

describe("filterHelpers", () => {
  describe("extractFilters", () => {
    it("should extract filters excluding page, limit, and search", () => {
      const query = {
        page: "1",
        limit: "10",
        search: "test",
        name: "John",
        active: "true",
      };

      const filters = extractFilters(query);

      expect(filters).toEqual({
        name: "John",
        active: "true",
      });
    });

    it("should return empty object when only pagination and search params present", () => {
      const query = {
        page: "1",
        limit: "10",
        search: "test",
      };

      const filters = extractFilters(query);

      expect(filters).toEqual({});
    });

    it("should return empty object when query is empty", () => {
      const query = {};

      const filters = extractFilters(query);

      expect(filters).toEqual({});
    });

    it("should handle multiple filter parameters", () => {
      const query = {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        active: "true",
        page: "1",
      };

      const filters = extractFilters(query);

      expect(filters).toEqual({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        active: "true",
      });
    });

    it("should only include string values", () => {
      const query = {
        name: "John",
        count: 5, // number, should be excluded
        active: true, // boolean, should be excluded
        tags: ["tag1", "tag2"], // array, should be excluded
      };

      const filters = extractFilters(query);

      expect(filters).toEqual({
        name: "John",
      });
    });

    it("should handle filters with special characters", () => {
      const query = {
        "user.name": "John",
        "vehicle.brand": "Toyota",
      };

      const filters = extractFilters(query);

      expect(filters).toEqual({
        "user.name": "John",
        "vehicle.brand": "Toyota",
      });
    });

    it("should work with typed filters", () => {
      interface UserFilters {
        firstName?: string;
        lastName?: string;
        email?: string;
      }

      const query = {
        firstName: "John",
        lastName: "Doe",
        page: "1",
      };

      const filters = extractFilters<UserFilters>(query);

      expect(filters).toEqual({
        firstName: "John",
        lastName: "Doe",
      });
      expect(filters.firstName).toBe("John");
    });

    it("should only extract allowed keys when allowedKeys is provided", () => {
      interface UserFilters {
        firstName?: string;
        lastName?: string;
        email?: string;
      }

      const query = {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        unknownField: "should be ignored",
        active: "true",
        page: "1",
      };

      const filters = extractFilters<UserFilters>(query, [
        "firstName",
        "lastName",
        "email",
      ]);

      expect(filters).toEqual({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      });
      expect(filters).not.toHaveProperty("unknownField");
      expect(filters).not.toHaveProperty("active");
    });

    it("should return empty object when no allowed keys match", () => {
      interface UserFilters {
        firstName?: string;
        lastName?: string;
      }

      const query = {
        email: "john@test.com",
        active: "true",
        page: "1",
      };

      const filters = extractFilters<UserFilters>(query, [
        "firstName",
        "lastName",
      ]);

      expect(filters).toEqual({});
    });

    it("should ignore allowedKeys when not provided", () => {
      interface UserFilters {
        firstName?: string;
        unknownField?: string;
      }

      const query = {
        firstName: "John",
        unknownField: "included",
        page: "1",
      };

      const filters = extractFilters<UserFilters>(query);

      expect(filters).toEqual({
        firstName: "John",
        unknownField: "included",
      });
    });
  });

  describe("extractSearch", () => {
    it("should extract search parameter when present", () => {
      const query = {
        search: "john",
        page: "1",
      };

      const search = extractSearch(query);

      expect(search).toBe("john");
    });

    it("should return undefined when search parameter is not present", () => {
      const query = {
        page: "1",
        limit: "10",
      };

      const search = extractSearch(query);

      expect(search).toBeUndefined();
    });

    it("should return undefined when search is not a string", () => {
      const query = {
        search: 123,
      };

      const search = extractSearch(query);

      expect(search).toBeUndefined();
    });

    it("should return undefined when search is an array", () => {
      const query = {
        search: ["test1", "test2"],
      };

      const search = extractSearch(query);

      expect(search).toBeUndefined();
    });

    it("should handle empty search string", () => {
      const query = {
        search: "",
      };

      const search = extractSearch(query);

      expect(search).toBe("");
    });

    it("should handle search with special characters", () => {
      const query = {
        search: "john@test.com",
      };

      const search = extractSearch(query);

      expect(search).toBe("john@test.com");
    });

    it("should handle search with spaces", () => {
      const query = {
        search: "John Doe",
      };

      const search = extractSearch(query);

      expect(search).toBe("John Doe");
    });
  });

  describe("combined usage", () => {
    it("should extract both search and filters correctly", () => {
      const query = {
        search: "john",
        firstName: "John",
        active: "true",
        page: "1",
        limit: "10",
      };

      const search = extractSearch(query);
      const filters = extractFilters(query);

      expect(search).toBe("john");
      expect(filters).toEqual({
        firstName: "John",
        active: "true",
      });
    });

    it("should handle query with only search", () => {
      const query = {
        search: "test query",
      };

      const search = extractSearch(query);
      const filters = extractFilters(query);

      expect(search).toBe("test query");
      expect(filters).toEqual({});
    });

    it("should handle query with only filters", () => {
      const query = {
        name: "John",
        email: "john@test.com",
      };

      const search = extractSearch(query);
      const filters = extractFilters(query);

      expect(search).toBeUndefined();
      expect(filters).toEqual({
        name: "John",
        email: "john@test.com",
      });
    });
  });
});
