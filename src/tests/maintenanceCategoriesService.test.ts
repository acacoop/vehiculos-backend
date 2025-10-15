import { describe, it, expect, beforeEach } from "@jest/globals";
import { MaintenanceCategoriesService } from "../services/maintenanceCategoriesService";
import { IMaintenanceCategoryRepository } from "../repositories/interfaces/IMaintenanceCategoryRepository";
import { MaintenanceCategory } from "../entities/MaintenanceCategory";
import { DeleteResult } from "typeorm";

class MockMaintenanceCategoryRepository
  implements IMaintenanceCategoryRepository
{
  private categories: MaintenanceCategory[] = [];
  private idCounter = 1;

  async findAll(): Promise<MaintenanceCategory[]> {
    return [...this.categories];
  }

  async findOne(id: string): Promise<MaintenanceCategory | null> {
    return this.categories.find((c) => c.id === id) || null;
  }

  create(data: Partial<MaintenanceCategory>): MaintenanceCategory {
    const category = new MaintenanceCategory();
    Object.assign(category, data);
    return category;
  }

  async save(entity: MaintenanceCategory): Promise<MaintenanceCategory> {
    const index = this.categories.findIndex((c) => c.id === entity.id);
    if (index >= 0) {
      this.categories[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `cat-${this.idCounter++}`;
      }
      this.categories.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index >= 0) {
      this.categories.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  reset() {
    this.categories = [];
    this.idCounter = 1;
  }

  seed(categories: MaintenanceCategory[]) {
    this.categories = [...categories];
  }
}

describe("MaintenanceCategoriesService", () => {
  let service: MaintenanceCategoriesService;
  let mockRepo: MockMaintenanceCategoryRepository;

  beforeEach(() => {
    mockRepo = new MockMaintenanceCategoryRepository();
    service = new MaintenanceCategoriesService(mockRepo);
  });

  describe("getAll", () => {
    it("should return empty array when no categories exist", async () => {
      const result = await service.getAll();
      expect(result).toEqual([]);
    });

    it("should return all categories", async () => {
      const cat1 = new MaintenanceCategory();
      cat1.id = "1";
      cat1.name = "Oil Change";
      const cat2 = new MaintenanceCategory();
      cat2.id = "2";
      cat2.name = "Tire Rotation";
      mockRepo.seed([cat1, cat2]);

      const result = await service.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Oil Change");
    });
  });

  describe("getById", () => {
    it("should return category when found", async () => {
      const cat = new MaintenanceCategory();
      cat.id = "1";
      cat.name = "Oil Change";
      mockRepo.seed([cat]);

      const result = await service.getById("1");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Oil Change");
    });

    it("should return null when not found", async () => {
      const result = await service.getById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a category", async () => {
      const result = await service.create({ name: "Brake Service" });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Brake Service");
      expect(result?.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update existing category", async () => {
      const cat = new MaintenanceCategory();
      cat.id = "1";
      cat.name = "Oil Change";
      mockRepo.seed([cat]);

      const result = await service.update("1", { name: "Premium Oil Change" });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Premium Oil Change");
    });

    it("should return null when not found", async () => {
      const result = await service.update("non-existent", { name: "Test" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete existing category", async () => {
      const cat = new MaintenanceCategory();
      cat.id = "1";
      cat.name = "Oil Change";
      mockRepo.seed([cat]);

      const result = await service.delete("1");

      expect(result).toBe(true);
    });

    it("should return false when not found", async () => {
      const result = await service.delete("non-existent");
      expect(result).toBe(false);
    });
  });
});
