import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { VehicleBrandService } from "../services/vehicleBrandService";
import { IVehicleBrandRepository } from "../repositories/interfaces/IVehicleBrandRepository";
import { VehicleBrand } from "../entities/VehicleBrand";
import { DeleteResult } from "typeorm";

class MockVehicleBrandRepository implements IVehicleBrandRepository {
  private brands: VehicleBrand[] = [];
  private idCounter = 1;

  async findAndCount(opts?: {
    pagination?: { limit?: number; offset?: number };
    searchParams?: { name?: string };
  }): Promise<[VehicleBrand[], number]> {
    const { pagination, searchParams } = opts || {};
    const limit = pagination?.limit ?? 10;
    const offset = pagination?.offset ?? 0;
    let filtered = [...this.brands];

    if (searchParams?.name) {
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(searchParams.name!.toLowerCase()),
      );
    }

    const paginated = filtered.slice(offset, offset + limit);
    return [paginated, filtered.length];
  }

  async findOne(id: string): Promise<VehicleBrand | null> {
    return this.brands.find((b) => b.id === id) || null;
  }

  async findOneByWhere(where: { id: string }): Promise<VehicleBrand | null> {
    return this.brands.find((b) => b.id === where.id) || null;
  }

  create(data: Partial<VehicleBrand>): VehicleBrand {
    const brand = new VehicleBrand();
    Object.assign(brand, data);
    return brand;
  }

  async save(entity: VehicleBrand): Promise<VehicleBrand> {
    const index = this.brands.findIndex((b) => b.id === entity.id);
    if (index >= 0) {
      this.brands[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `brand-uuid-${this.idCounter++}`;
      }
      this.brands.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.brands.findIndex((b) => b.id === id);
    if (index >= 0) {
      this.brands.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  reset() {
    this.brands = [];
    this.idCounter = 1;
  }

  seedBrands(brands: VehicleBrand[]) {
    this.brands = [...brands];
  }
}

describe("VehicleBrandService", () => {
  let service: VehicleBrandService;
  let mockRepo: MockVehicleBrandRepository;

  beforeEach(() => {
    mockRepo = new MockVehicleBrandRepository();
    service = new VehicleBrandService(mockRepo);
  });

  afterEach(() => {
    mockRepo.reset();
  });

  describe("getAll", () => {
    it("should return empty list when no brands exist", async () => {
      const result = await service.getAll();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return all brands with pagination", async () => {
      const brands = [
        createTestBrand("1", "Toyota"),
        createTestBrand("2", "Ford"),
        createTestBrand("3", "Honda"),
      ];
      mockRepo.seedBrands(brands);

      const result = await service.getAll({
        pagination: { limit: 2, offset: 0 },
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.items[0].name).toBe("Toyota");
      expect(result.items[1].name).toBe("Ford");
    });

    it("should filter brands by name", async () => {
      const brands = [
        createTestBrand("1", "Toyota"),
        createTestBrand("2", "Ford"),
        createTestBrand("3", "Honda"),
      ];
      mockRepo.seedBrands(brands);

      const result = await service.getAll({
        searchParams: { name: "toy" },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Toyota");
    });

    it("should handle pagination with offset", async () => {
      const brands = [
        createTestBrand("1", "Toyota"),
        createTestBrand("2", "Ford"),
        createTestBrand("3", "Honda"),
      ];
      mockRepo.seedBrands(brands);

      const result = await service.getAll({
        pagination: { limit: 1, offset: 1 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Ford");
      expect(result.total).toBe(3);
    });
  });

  describe("getById", () => {
    it("should return brand when found", async () => {
      const brand = createTestBrand("1", "Toyota");
      mockRepo.seedBrands([brand]);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Toyota");
      expect(result?.id).toBe("1");
    });

    it("should return null when brand not found", async () => {
      const result = await service.getById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new brand", async () => {
      const brandData = { name: "Tesla" };

      const result = await service.create(brandData);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Tesla");
      expect(result?.id).toBeDefined();
    });

    it("should create multiple brands with unique IDs", async () => {
      const brand1 = await service.create({ name: "Tesla" });
      const brand2 = await service.create({ name: "BMW" });

      expect(brand1?.id).not.toBe(brand2?.id);
      expect(brand1?.name).toBe("Tesla");
      expect(brand2?.name).toBe("BMW");
    });
  });

  describe("update", () => {
    it("should update existing brand", async () => {
      const brand = createTestBrand("1", "Toyota");
      mockRepo.seedBrands([brand]);

      const updated = await service.update("1", { name: "Toyota Motors" });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Toyota Motors");
      expect(updated?.id).toBe("1");
    });

    it("should return null when brand not found", async () => {
      const result = await service.update("non-existent", { name: "Test" });
      expect(result).toBeNull();
    });

    it("should not update if name is not provided", async () => {
      const brand = createTestBrand("1", "Toyota");
      mockRepo.seedBrands([brand]);

      const updated = await service.update("1", {});

      expect(updated?.name).toBe("Toyota");
    });
  });

  describe("delete", () => {
    it("should delete existing brand and return true", async () => {
      const brand = createTestBrand("1", "Toyota");
      mockRepo.seedBrands([brand]);

      const result = await service.delete("1");

      expect(result).toBe(true);
      const checkDeleted = await service.getById("1");
      expect(checkDeleted).toBeNull();
    });

    it("should return false when brand not found", async () => {
      const result = await service.delete("non-existent");
      expect(result).toBe(false);
    });

    it("should only delete the specified brand", async () => {
      const brands = [
        createTestBrand("1", "Toyota"),
        createTestBrand("2", "Ford"),
      ];
      mockRepo.seedBrands(brands);

      await service.delete("1");

      const remaining = await service.getAll();
      expect(remaining.items).toHaveLength(1);
      expect(remaining.items[0].name).toBe("Ford");
    });
  });
});

function createTestBrand(id: string, name: string): VehicleBrand {
  const brand = new VehicleBrand();
  brand.id = id;
  brand.name = name;
  return brand;
}
