import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AssignedMaintenancesService } from "../services/maintenancesService";
import { IAssignedMaintenanceRepository } from "../repositories/interfaces/IAssignedMaintenanceRepository";
import { AssignedMaintenance } from "../entities/AssignedMaintenance";
import { Vehicle } from "../entities/Vehicle";
import { Maintenance } from "../entities/Maintenance";
import { MaintenanceCategory } from "../entities/MaintenanceCategory";
import { VehicleModel } from "../entities/VehicleModel";
import { VehicleBrand } from "../entities/VehicleBrand";
import { Repository, DeleteResult } from "typeorm";
import * as validators from "../utils/validation/entity";

jest.mock("../utils/validation/entity");

class MockAssignedMaintenanceRepository
  implements IAssignedMaintenanceRepository
{
  private assignedMaintenances: AssignedMaintenance[] = [];
  private idCounter = 1;

  async findByVehicle(vehicleId: string): Promise<AssignedMaintenance[]> {
    return this.assignedMaintenances.filter(
      (am) => am.vehicle.id === vehicleId,
    );
  }

  async findByMaintenance(
    maintenanceId: string,
  ): Promise<AssignedMaintenance[]> {
    return this.assignedMaintenances.filter(
      (am) => am.maintenance.id === maintenanceId,
    );
  }

  async findOne(id: string): Promise<AssignedMaintenance | null> {
    return this.assignedMaintenances.find((am) => am.id === id) || null;
  }

  create(data: Partial<AssignedMaintenance>): AssignedMaintenance {
    const am = new AssignedMaintenance();
    Object.assign(am, data);
    return am;
  }

  async save(entity: AssignedMaintenance): Promise<AssignedMaintenance> {
    const index = this.assignedMaintenances.findIndex(
      (am) => am.id === entity.id,
    );
    if (index >= 0) {
      this.assignedMaintenances[index] = entity;
    } else {
      if (!entity.id) {
        entity.id = `assigned-uuid-${this.idCounter++}`;
      }
      this.assignedMaintenances.push(entity);
    }
    return entity;
  }

  async delete(id: string): Promise<DeleteResult> {
    const index = this.assignedMaintenances.findIndex((am) => am.id === id);
    if (index >= 0) {
      this.assignedMaintenances.splice(index, 1);
      return { affected: 1, raw: {} };
    }
    return { affected: 0, raw: {} };
  }

  reset() {
    this.assignedMaintenances = [];
    this.idCounter = 1;
  }

  seedAssignedMaintenances(items: AssignedMaintenance[]) {
    this.assignedMaintenances = [...items];
  }
}

const createTestVehicle = (id: string, licensePlate: string): Vehicle => {
  const vehicle = new Vehicle();
  vehicle.id = id;
  vehicle.licensePlate = licensePlate;
  vehicle.year = 2020;

  const brand = new VehicleBrand();
  brand.id = "brand-1";
  brand.name = "Toyota";

  const model = new VehicleModel();
  model.id = "model-1";
  model.name = "Corolla";
  model.brand = brand;

  vehicle.model = model;
  return vehicle;
};

const createTestMaintenance = (
  id: string,
  name: string,
  categoryName: string,
): Maintenance => {
  const maintenance = new Maintenance();
  maintenance.id = id;
  maintenance.name = name;
  maintenance.kilometersFrequency = 10000;
  maintenance.daysFrequency = 180;
  maintenance.observations = null;
  maintenance.instructions = null;

  const category = new MaintenanceCategory();
  category.id = "cat-1";
  category.name = categoryName;
  maintenance.category = category;

  return maintenance;
};

const createTestAssignedMaintenance = (
  id: string,
  vehicle: Vehicle,
  maintenance: Maintenance,
): AssignedMaintenance => {
  const am = new AssignedMaintenance();
  am.id = id;
  am.vehicle = vehicle;
  am.maintenance = maintenance;
  am.kilometersFrequency = 10000;
  am.daysFrequency = 180;
  am.observations = null;
  am.instructions = null;
  return am;
};

describe("AssignedMaintenancesService", () => {
  let service: AssignedMaintenancesService;
  let mockRepo: MockAssignedMaintenanceRepository;
  let mockVehicleRepo: jest.Mocked<Repository<Vehicle>>;
  let mockMaintenanceRepo: jest.Mocked<Repository<Maintenance>>;

  beforeEach(() => {
    mockRepo = new MockAssignedMaintenanceRepository();

    mockVehicleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vehicle>>;

    mockMaintenanceRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Maintenance>>;

    service = new AssignedMaintenancesService(
      mockRepo,
      mockVehicleRepo,
      mockMaintenanceRepo,
    );
  });

  describe("getByVehicle", () => {
    it("should return all assigned maintenances for a vehicle", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance1 = createTestMaintenance("m1", "Oil Change", "Engine");
      const maintenance2 = createTestMaintenance(
        "m2",
        "Tire Rotation",
        "Tires",
      );

      const am1 = createTestAssignedMaintenance("am1", vehicle, maintenance1);
      const am2 = createTestAssignedMaintenance("am2", vehicle, maintenance2);

      mockRepo.seedAssignedMaintenances([am1, am2]);

      const result = await service.getByVehicle("v1");

      expect(result).toHaveLength(2);
      expect(result[0].vehicleId).toBe("v1");
      expect(result[0].maintenanceId).toBe("m1");
      expect(result[0].maintenance_name).toBe("Oil Change");
      expect(result[0].maintenance_category_name).toBe("Engine");
    });

    it("should return empty array when vehicle has no assigned maintenances", async () => {
      const result = await service.getByVehicle("non-existent");

      expect(result).toEqual([]);
    });

    it("should filter by vehicle ID correctly", async () => {
      const vehicle1 = createTestVehicle("v1", "ABC123");
      const vehicle2 = createTestVehicle("v2", "DEF456");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      const am1 = createTestAssignedMaintenance("am1", vehicle1, maintenance);
      const am2 = createTestAssignedMaintenance("am2", vehicle2, maintenance);

      mockRepo.seedAssignedMaintenances([am1, am2]);

      const result = await service.getByVehicle("v1");

      expect(result).toHaveLength(1);
      expect(result[0].vehicleId).toBe("v1");
    });
  });

  describe("getById", () => {
    it("should return assigned maintenance by id", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");
      const am = createTestAssignedMaintenance("am1", vehicle, maintenance);

      mockRepo.seedAssignedMaintenances([am]);

      const result = await service.getById("am1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("am1");
      expect(result?.vehicleId).toBe("v1");
      expect(result?.maintenanceId).toBe("m1");
      expect(result?.kilometersFrequency).toBe(10000);
      expect(result?.daysFrequency).toBe(180);
    });

    it("should return null when assigned maintenance not found", async () => {
      const result = await service.getById("non-existent");

      expect(result).toBeNull();
    });

    it("should map all fields correctly", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");
      maintenance.observations = "Check oil level";
      maintenance.instructions = "Use synthetic oil";

      const am = createTestAssignedMaintenance("am1", vehicle, maintenance);
      am.observations = "Vehicle specific note";
      am.instructions = "Special procedure";

      mockRepo.seedAssignedMaintenances([am]);

      const result = await service.getById("am1");

      expect(result?.observations).toBe("Vehicle specific note");
      expect(result?.instructions).toBe("Special procedure");
      expect(result?.maintenance_observations).toBe("Check oil level");
      expect(result?.maintenance_instructions).toBe("Use synthetic oil");
    });
  });

  describe("create", () => {
    it("should create new assigned maintenance", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findOne.mockResolvedValue(maintenance);

      const result = await service.create({
        vehicleId: "v1",
        maintenanceId: "m1",
        kilometersFrequency: 5000,
        daysFrequency: 90,
        observations: "Custom observation",
        instructions: "Custom instructions",
      });

      expect(result).not.toBeNull();
      expect(result?.vehicleId).toBe("v1");
      expect(result?.maintenanceId).toBe("m1");
      expect(result?.kilometersFrequency).toBe(5000);
      expect(result?.daysFrequency).toBe(90);
      expect(result?.observations).toBe("Custom observation");
      expect(result?.instructions).toBe("Custom instructions");
    });

    it("should create with minimal data (no optional fields)", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findOne.mockResolvedValue(maintenance);

      const result = await service.create({
        vehicleId: "v1",
        maintenanceId: "m1",
      });

      expect(result).not.toBeNull();
      expect(result?.kilometersFrequency).toBeUndefined();
      expect(result?.daysFrequency).toBeUndefined();
    });

    it("should return null when vehicle not found", async () => {
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(null);
      mockMaintenanceRepo.findOne.mockResolvedValue(maintenance);

      const result = await service.create({
        vehicleId: "non-existent",
        maintenanceId: "m1",
      });

      expect(result).toBeNull();
    });

    it("should return null when maintenance not found", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");

      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        vehicleId: "v1",
        maintenanceId: "non-existent",
      });

      expect(result).toBeNull();
    });

    it("should validate vehicle exists", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      const validateSpy = jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findOne.mockResolvedValue(maintenance);

      await service.create({
        vehicleId: "v1",
        maintenanceId: "m1",
      });

      expect(validateSpy).toHaveBeenCalledWith("v1");
    });

    it("should validate maintenance exists", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      const validateSpy = jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findOne.mockResolvedValue(maintenance);

      await service.create({
        vehicleId: "v1",
        maintenanceId: "m1",
      });

      expect(validateSpy).toHaveBeenCalledWith("m1");
    });
  });

  describe("update", () => {
    it("should update assigned maintenance frequencies", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");
      const am = createTestAssignedMaintenance("am1", vehicle, maintenance);

      mockRepo.seedAssignedMaintenances([am]);

      const result = await service.update("am1", {
        kilometersFrequency: 15000,
        daysFrequency: 365,
      });

      expect(result).not.toBeNull();
      expect(result?.kilometersFrequency).toBe(15000);
      expect(result?.daysFrequency).toBe(365);
    });

    it("should update observations and instructions", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");
      const am = createTestAssignedMaintenance("am1", vehicle, maintenance);

      mockRepo.seedAssignedMaintenances([am]);

      const result = await service.update("am1", {
        observations: "Updated observation",
        instructions: "Updated instructions",
      });

      expect(result?.observations).toBe("Updated observation");
      expect(result?.instructions).toBe("Updated instructions");
    });

    it("should return null when assigned maintenance not found", async () => {
      const result = await service.update("non-existent", {
        kilometersFrequency: 5000,
      });

      expect(result).toBeNull();
    });

    it("should allow partial updates", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");
      const am = createTestAssignedMaintenance("am1", vehicle, maintenance);
      am.kilometersFrequency = 10000;
      am.daysFrequency = 180;

      mockRepo.seedAssignedMaintenances([am]);

      const result = await service.update("am1", {
        kilometersFrequency: 8000,
        // daysFrequency not updated
      });

      expect(result?.kilometersFrequency).toBe(8000);
      expect(result?.daysFrequency).toBe(180); // Should remain unchanged
    });

    it("should handle setting frequencies to null", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");
      const am = createTestAssignedMaintenance("am1", vehicle, maintenance);

      mockRepo.seedAssignedMaintenances([am]);

      const result = await service.update("am1", {
        kilometersFrequency: null,
        daysFrequency: null,
      });

      expect(result?.kilometersFrequency).toBeUndefined();
      expect(result?.daysFrequency).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("should delete existing assigned maintenance", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");
      const am = createTestAssignedMaintenance("am1", vehicle, maintenance);

      mockRepo.seedAssignedMaintenances([am]);

      const result = await service.delete("am1");

      expect(result).toBe(true);
      const checkDeleted = await service.getById("am1");
      expect(checkDeleted).toBeNull();
    });

    it("should return false when assigned maintenance not found", async () => {
      const result = await service.delete("non-existent");

      expect(result).toBe(false);
    });

    it("should only delete specified assigned maintenance", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance1 = createTestMaintenance("m1", "Oil Change", "Engine");
      const maintenance2 = createTestMaintenance(
        "m2",
        "Tire Rotation",
        "Tires",
      );

      const am1 = createTestAssignedMaintenance("am1", vehicle, maintenance1);
      const am2 = createTestAssignedMaintenance("am2", vehicle, maintenance2);

      mockRepo.seedAssignedMaintenances([am1, am2]);

      await service.delete("am1");

      const remaining = await service.getByVehicle("v1");
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("am2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle vehicle with many assigned maintenances", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenances = Array.from({ length: 10 }, (_, i) =>
        createTestMaintenance(`m${i}`, `Maintenance ${i}`, "Category"),
      );

      const assignedMaintenances = maintenances.map((m, i) =>
        createTestAssignedMaintenance(`am${i}`, vehicle, m),
      );

      mockRepo.seedAssignedMaintenances(assignedMaintenances);

      const result = await service.getByVehicle("v1");

      expect(result).toHaveLength(10);
    });

    it("should handle frequencies set to zero", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findOne.mockResolvedValue(maintenance);

      const result = await service.create({
        vehicleId: "v1",
        maintenanceId: "m1",
        kilometersFrequency: 0,
        daysFrequency: 0,
      });

      expect(result?.kilometersFrequency).toBe(0);
      expect(result?.daysFrequency).toBe(0);
    });

    it("should handle empty strings in observations and instructions", async () => {
      const vehicle = createTestVehicle("v1", "ABC123");
      const maintenance = createTestMaintenance("m1", "Oil Change", "Engine");

      jest
        .spyOn(validators, "validateVehicleExists")
        .mockResolvedValue(undefined);
      jest
        .spyOn(validators, "validateMaintenanceExists")
        .mockResolvedValue(undefined);
      mockVehicleRepo.findOne.mockResolvedValue(vehicle);
      mockMaintenanceRepo.findOne.mockResolvedValue(maintenance);

      const result = await service.create({
        vehicleId: "v1",
        maintenanceId: "m1",
        observations: "",
        instructions: "",
      });

      expect(result?.observations).toBe("");
      expect(result?.instructions).toBe("");
    });
  });
});
