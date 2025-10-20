import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { VehicleModelService } from "services/vehicleModelsService";
import { IVehicleModelRepository } from "repositories/interfaces/IVehicleModelRepository";
import { IVehicleBrandRepository } from "repositories/interfaces/IVehicleBrandRepository";
import { VehicleModel } from "entities/VehicleModel";
import { VehicleBrand } from "entities/VehicleBrand";
import { DeleteResult } from "typeorm";

class MockVehicleModelRepository implements IVehicleModelRepository {
  private models: VehicleModel[] = [];
  private idCounter = 1;

  async findAndCount(opts?: {
    pagination?: { limit?: number; offset?: number };
    filters?: { name?: string; brandId?: string };
    search?: string;
  }): Promise<[VehicleModel[], number]> {
    const { pagination, filters, search } = opts || {};
    const limit = pagination?.limit ?? 10;
    const offset = pagination?.offset ?? 0;
    let filtered = [...this.models];

    // Apply search
    if (search) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.brand.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Apply filters
    if (filters?.name) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(filters.name!.toLowerCase()),
      );
    }

    if (filters?.brandId) {
      filtered = filtered.filter((m) => m.brand.id === filters.brandId);
    }

    const paginated = filtered.slice(offset, offset + limit);
    return [paginated, filtered.length];
  }

  async findOne(id: string): Promise<VehicleModel | null> {
    return this.models.find((m) => m.id === id) || null;
  }

  create(data: Partial<VehicleModel>): VehicleModel {
    const model = new VehicleModel();
    Object.assign(model, data);
    return model;
  }

  async save(entity: VehicleModel): Promise<VehicleModel> {
    const index = this.models.findIndex((m) => m.id === entity.id);
    if (index >= 0) {
      this.models[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `model-uuid-${this.idCounter++}`;
      }
      this.models.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.models.findIndex((m) => m.id === id);
    if (index >= 0) {
      this.models.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  reset() {
    this.models = [];
    this.idCounter = 1;
  }

  seedModels(models: VehicleModel[]) {
    this.models = [...models];
  }
}

class MockVehicleBrandRepository implements IVehicleBrandRepository {
  private brands: VehicleBrand[] = [];

  async findAndCount(): Promise<[VehicleBrand[], number]> {
    return [this.brands, this.brands.length];
  }

  async findOne(id: string): Promise<VehicleBrand | null> {
    return this.brands.find((b) => b.id === id) || null;
  }

  async findOneByWhere(where: { id: string }): Promise<VehicleBrand | null> {
    return this.brands.find((b) => b.id === where.id) || null;
  }

  create(): VehicleBrand {
    return new VehicleBrand();
  }

  async save(entity: VehicleBrand): Promise<VehicleBrand> {
    return entity;
  }

  async delete(): Promise<DeleteResult> {
    return { affected: 0, raw: {} };
  }

  seedBrands(brands: VehicleBrand[]) {
    this.brands = [...brands];
  }

  reset() {
    this.brands = [];
  }
}

describe("VehicleModelService", () => {
  let service: VehicleModelService;
  let mockModelRepo: MockVehicleModelRepository;
  let mockBrandRepo: MockVehicleBrandRepository;

  beforeEach(() => {
    mockModelRepo = new MockVehicleModelRepository();
    mockBrandRepo = new MockVehicleBrandRepository();
    service = new VehicleModelService(mockModelRepo, mockBrandRepo);
  });

  afterEach(() => {
    mockModelRepo.reset();
    mockBrandRepo.reset();
  });

  describe("getAll", () => {
    it("should return empty list when no models exist", async () => {
      const result = await service.getAll();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return all models with pagination", async () => {
      const brand = createTestBrand("1", "Toyota");
      const models = [
        createTestModel("1", "Corolla", brand),
        createTestModel("2", "Camry", brand),
        createTestModel("3", "RAV4", brand),
      ];
      mockModelRepo.seedModels(models);

      const result = await service.getAll({
        pagination: { limit: 2, offset: 0 },
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.items[0].name).toBe("Corolla");
      expect(result.items[1].name).toBe("Camry");
    });

    it("should filter models by name", async () => {
      const brand = createTestBrand("1", "Toyota");
      const models = [
        createTestModel("1", "Corolla", brand),
        createTestModel("2", "Camry", brand),
        createTestModel("3", "RAV4", brand),
      ];
      mockModelRepo.seedModels(models);

      const result = await service.getAll({
        filters: { name: "cam" },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Camry");
    });

    it("should filter models by brandId", async () => {
      const toyota = createTestBrand("1", "Toyota");
      const ford = createTestBrand("2", "Ford");
      const models = [
        createTestModel("1", "Corolla", toyota),
        createTestModel("2", "Mustang", ford),
        createTestModel("3", "Camry", toyota),
      ];
      mockModelRepo.seedModels(models);

      const result = await service.getAll({
        filters: { brandId: "1" },
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe("Corolla");
      expect(result.items[1].name).toBe("Camry");
    });

    it("should handle pagination with offset", async () => {
      const brand = createTestBrand("1", "Toyota");
      const models = [
        createTestModel("1", "Corolla", brand),
        createTestModel("2", "Camry", brand),
        createTestModel("3", "RAV4", brand),
      ];
      mockModelRepo.seedModels(models);

      const result = await service.getAll({
        pagination: { limit: 1, offset: 1 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Camry");
      expect(result.total).toBe(3);
    });
  });

  describe("getById", () => {
    it("should return model when found", async () => {
      const brand = createTestBrand("1", "Toyota");
      const model = createTestModel("1", "Corolla", brand);
      mockModelRepo.seedModels([model]);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Corolla");
      expect(result?.brand.name).toBe("Toyota");
    });

    it("should return null when model not found", async () => {
      const result = await service.getById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new model with existing brand", async () => {
      const brand = createTestBrand("1", "Toyota");
      mockBrandRepo.seedBrands([brand]);

      const modelData = { name: "Corolla", brandId: "1" };
      const result = await service.create(modelData);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Corolla");
      expect(result?.brand.id).toBe("1");
      expect(result?.id).toBeDefined();
    });

    it("should throw error when brand not found", async () => {
      const modelData = { name: "Corolla", brandId: "non-existent" };

      await expect(service.create(modelData)).rejects.toThrow(
        "Brand with ID non-existent not found",
      );
    });

    it("should create multiple models for same brand", async () => {
      const brand = createTestBrand("1", "Toyota");
      mockBrandRepo.seedBrands([brand]);

      const model1 = await service.create({ name: "Corolla", brandId: "1" });
      const model2 = await service.create({ name: "Camry", brandId: "1" });

      expect(model1?.id).not.toBe(model2?.id);
      expect(model1?.brand.id).toBe("1");
      expect(model2?.brand.id).toBe("1");
    });
  });

  describe("update", () => {
    it("should update existing model name", async () => {
      const brand = createTestBrand("1", "Toyota");
      const model = createTestModel("1", "Corolla", brand);
      mockModelRepo.seedModels([model]);

      const updated = await service.update("1", {
        name: "Corolla Hybrid",
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Corolla Hybrid");
      expect(updated?.brand.id).toBe("1");
    });

    it("should update model brand", async () => {
      const toyota = createTestBrand("1", "Toyota");
      const ford = createTestBrand("2", "Ford");
      const model = createTestModel("1", "Corolla", toyota);
      mockModelRepo.seedModels([model]);
      mockBrandRepo.seedBrands([toyota, ford]);

      const updated = await service.update("1", { brandId: "2" });

      expect(updated).not.toBeNull();
      expect(updated?.brand.id).toBe("2");
    });

    it("should throw error when updating with non-existent brand", async () => {
      const brand = createTestBrand("1", "Toyota");
      const model = createTestModel("1", "Corolla", brand);
      mockModelRepo.seedModels([model]);

      await expect(
        service.update("1", { brandId: "non-existent" }),
      ).rejects.toThrow("Brand with ID non-existent not found");
    });

    it("should return null when model not found", async () => {
      const result = await service.update("non-existent", { name: "Test" });
      expect(result).toBeNull();
    });

    it("should not update if no changes provided", async () => {
      const brand = createTestBrand("1", "Toyota");
      const model = createTestModel("1", "Corolla", brand);
      mockModelRepo.seedModels([model]);

      const updated = await service.update("1", {});

      expect(updated?.name).toBe("Corolla");
      expect(updated?.brand.id).toBe("1");
    });
  });

  describe("delete", () => {
    it("should delete existing model and return true", async () => {
      const brand = createTestBrand("1", "Toyota");
      const model = createTestModel("1", "Corolla", brand);
      mockModelRepo.seedModels([model]);

      const result = await service.delete("1");

      expect(result).toBe(true);
      const checkDeleted = await service.getById("1");
      expect(checkDeleted).toBeNull();
    });

    it("should return false when model not found", async () => {
      const result = await service.delete("non-existent");
      expect(result).toBe(false);
    });

    it("should only delete the specified model", async () => {
      const brand = createTestBrand("1", "Toyota");
      const models = [
        createTestModel("1", "Corolla", brand),
        createTestModel("2", "Camry", brand),
      ];
      mockModelRepo.seedModels(models);

      await service.delete("1");

      const remaining = await service.getAll();
      expect(remaining.items).toHaveLength(1);
      expect(remaining.items[0].name).toBe("Camry");
    });
  });
});

function createTestBrand(id: string, name: string): VehicleBrand {
  const brand = new VehicleBrand();
  brand.id = id;
  brand.name = name;
  return brand;
}

function createTestModel(
  id: string,
  name: string,
  brand: VehicleBrand,
): VehicleModel {
  const model = new VehicleModel();
  model.id = id;
  model.name = name;
  model.brand = brand;
  return model;
}
