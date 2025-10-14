/**
 * Permission System Integration Tests
 * 
 * Tests all permission scenarios:
 * - Admin role
 * - Current drivers (DRIVER permission)
 * - Current responsibles (FULL permission)
 * - Old drivers/responsibles (no permission)
 * - Direct user ACLs
 * - Group ACLs
 * - CECO range ACLs
 * - Permission weight hierarchy
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { AppDataSource } from "../db";
import { PermissionChecker } from "../middleware/permissions/checker";
import { PermissionType } from "../entities/authorization/PermissionType";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";

// Test users from sample data
const TEST_USERS = {
  admin: "carlos.rodriguez@sample.test",
  currentDriverABC: "ana.martinez@sample.test", // Current driver of ABC123
  currentDriverDEF: "diego.garcia@sample.test", // Current driver of DEF456
  currentDriverMNO: "valentina.silva@sample.test", // Current driver & responsible of MNO345
  oldDriverABC: "juan.perez@sample.test", // Old driver ABC123 (ended 2023), in directGroup
  oldDriverMNO: "sofia.hernandez@sample.test", // Old driver MNO345 (ended May 2024)
  responsibleDEF: "maria.gonzalez@sample.test", // Current responsible DEF456, in cecoGroup
  directACL: "miguel.vargas@sample.test", // Direct ACL DRIVER on ABC123 & DEF456
  noPermissions: "lucia.castro@sample.test", // No permissions
};

// Test vehicles from sample data
const TEST_VEHICLES = {
  ABC123: "ABC123", // V1 - Corolla 2023
  DEF456: "DEF456", // V2 - Civic 2022, CECO: 23000000 (responsible: María)
  MNO345: "MNO345", // V3 - RAV4 2023, CECO: 17001234 (responsible: Valentina)
};

describe("Permission System Integration Tests", () => {
  let checker: PermissionChecker;
  let users: Map<string, User>;
  let vehicles: Map<string, Vehicle>;

  beforeAll(async () => {
    // Initialize database connection
    await AppDataSource.initialize();
    checker = new PermissionChecker(AppDataSource);

    // Load users
    const userRepo = AppDataSource.getRepository(User);
    const allUsers = await userRepo.find();
    users = new Map(allUsers.map((u) => [u.email, u]));

    // Load vehicles
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const allVehicles = await vehicleRepo.find();
    vehicles = new Map(allVehicles.map((v) => [v.licensePlate, v]));
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe("1. Admin Role", () => {
    test("1.1 Admin has DRIVER access to ABC123", async () => {
      const userId = users.get(TEST_USERS.admin)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("1.2 Admin has FULL access to DEF456", async () => {
      const userId = users.get(TEST_USERS.admin)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(true);
    });

    test("1.3 Admin has READ access to MNO345", async () => {
      const userId = users.get(TEST_USERS.admin)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.MNO345)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });
  });

  describe("2. Current Driver (Assignment-based)", () => {
    test("2.1 Ana (current driver) has DRIVER access to ABC123", async () => {
      const userId = users.get(TEST_USERS.currentDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("2.2 Ana (current driver) has MAINTAINER access to ABC123", async () => {
      const userId = users.get(TEST_USERS.currentDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.MAINTAINER,
      });
      expect(result).toBe(true);
    });

    test("2.3 Ana (current driver) has READ access to ABC123", async () => {
      const userId = users.get(TEST_USERS.currentDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });

    test("2.4 Ana (current driver) does NOT have FULL access to ABC123", async () => {
      const userId = users.get(TEST_USERS.currentDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false);
    });

    test("2.5 Diego (current driver) has DRIVER access to DEF456", async () => {
      const userId = users.get(TEST_USERS.currentDriverDEF)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });
  });

  describe("3. Old Driver (No automatic permission)", () => {
    test("3.1 Sofia (old driver MNO345) does NOT have access", async () => {
      const userId = users.get(TEST_USERS.oldDriverMNO)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.MNO345)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("3.2 Juan (old driver ABC123) HAS access via directGroup ACL", async () => {
      const userId = users.get(TEST_USERS.oldDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true); // Has access via group, not driver status
    });
  });

  describe("4. Current Responsible (FULL permission)", () => {
    test("4.1 María (responsible DEF456) has FULL access", async () => {
      const userId = users.get(TEST_USERS.responsibleDEF)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(true);
    });

    test("4.2 María (responsible DEF456) has DRIVER access", async () => {
      const userId = users.get(TEST_USERS.responsibleDEF)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("4.3 Valentina (responsible MNO345) has FULL access", async () => {
      const userId = users.get(TEST_USERS.currentDriverMNO)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.MNO345)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(true);
    });
  });

  describe("5. Direct User ACL", () => {
    test("5.1 Miguel has DRIVER access to ABC123 via direct ACL", async () => {
      const userId = users.get(TEST_USERS.directACL)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("5.2 Miguel has DRIVER access to DEF456 via direct ACL", async () => {
      const userId = users.get(TEST_USERS.directACL)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("5.3 Miguel has READ access to ABC123 (via DRIVER)", async () => {
      const userId = users.get(TEST_USERS.directACL)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });

    test("5.4 Miguel does NOT have access to MNO345", async () => {
      const userId = users.get(TEST_USERS.directACL)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.MNO345)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("5.5 Miguel does NOT have FULL access to ABC123", async () => {
      const userId = users.get(TEST_USERS.directACL)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false);
    });
  });

  describe("6. Group ACL", () => {
    test("6.1 Juan has DRIVER access to ABC123 via directGroup", async () => {
      const userId = users.get(TEST_USERS.oldDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("6.2 Juan has DRIVER access to DEF456 via directGroup", async () => {
      const userId = users.get(TEST_USERS.oldDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("6.3 Juan has READ access via DRIVER permission", async () => {
      const userId = users.get(TEST_USERS.oldDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });
  });

  describe("7. CECO Range ACL", () => {
    test("7.1 María has access to DEF456 via CECO group (multiple sources)", async () => {
      const userId = users.get(TEST_USERS.responsibleDEF)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true); // Has via responsible + CECO group
    });

    test("7.2 María does NOT have access to MNO345 via CECO (wrong range)", async () => {
      const userId = users.get(TEST_USERS.responsibleDEF)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.MNO345)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false); // CECO 17001234 outside range 23M-23M
    });
  });

  describe("8. No Permissions", () => {
    test("8.1 Lucía has NO access to ABC123", async () => {
      const userId = users.get(TEST_USERS.noPermissions)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("8.2 Sofia (old driver) has NO access to MNO345", async () => {
      const userId = users.get(TEST_USERS.oldDriverMNO)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.MNO345)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.READ,
      });
      expect(result).toBe(false);
    });
  });

  describe("9. Permission Weight Hierarchy", () => {
    test("9.1 Miguel (DRIVER) does NOT have FULL access", async () => {
      const userId = users.get(TEST_USERS.directACL)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false); // DRIVER (3) < FULL (4)
    });

    test("9.2 Ana (DRIVER) does NOT have FULL access", async () => {
      const userId = users.get(TEST_USERS.currentDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.ABC123)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false); // DRIVER (3) < FULL (4)
    });

    test("9.3 María (FULL) has READ access", async () => {
      const userId = users.get(TEST_USERS.responsibleDEF)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true); // FULL (4) >= READ (1)
    });

    test("9.4 Juan (DRIVER) has MAINTAINER access", async () => {
      const userId = users.get(TEST_USERS.oldDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.MAINTAINER,
      });
      expect(result).toBe(true); // DRIVER (3) >= MAINTAINER (2)
    });
  });

  describe("10. Edge Cases", () => {
    test("10.1 Ana does NOT have access to DEF456 (not her vehicle)", async () => {
      const userId = users.get(TEST_USERS.currentDriverABC)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.DEF456)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("10.2 Diego does NOT have access to MNO345", async () => {
      const userId = users.get(TEST_USERS.currentDriverDEF)!.id;
      const vehicleId = vehicles.get(TEST_VEHICLES.MNO345)!.id;
      const result = await checker.checkUserPermission(userId, {
        type: "vehicle",
        vehicleId,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });
  });
});
