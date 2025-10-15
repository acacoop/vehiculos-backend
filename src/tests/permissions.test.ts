/**
 * Permission System Unit Tests - Simplified ACL System
 *
 * Tests permission scenarios with the simplified ACL system:
 * - Admin role (has access to everything)
 * - Current drivers via assignments (DRIVER permission)
 * - Current responsibles (FULL permission)
 * - Expired assignments/responsibles (no automatic permission)
 * - Direct user-vehicle ACLs with time periods
 * - Permission weight hierarchy (READ < MAINTAINER < DRIVER < FULL)
 * - Permission filtering in repositories
 */

import { describe, test, expect, jest } from "@jest/globals";
import { PermissionChecker } from "../middleware/permission";
import { PermissionType } from "../entities/PermissionType";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import { Assignment } from "../entities/Assignment";
import { VehicleResponsible } from "../entities/VehicleResponsible";
import { VehicleACL } from "../entities/VehicleACL";
import { UserRole } from "../entities/UserRole";
import { UserRoleEnum } from "../entities/UserRoleEnum";
import { DataSource, Repository } from "typeorm";
import { getAllowedPermissions } from "../utils/permissions";

// Test user IDs
const ADMIN_ID = "admin-1";
const CURRENT_DRIVER_ID = "user-ana";
const RESPONSIBLE_ID = "user-maria";
const ACL_USER_ID = "user-miguel";
const OLD_DRIVER_ID = "user-juan";
const NO_PERMISSIONS_ID = "user-lucia";

// Test vehicle IDs
const VEHICLE_1_ID = "vehicle-1";
const VEHICLE_2_ID = "vehicle-2";
const VEHICLE_3_ID = "vehicle-3";

const now = new Date();
const oneYearAgo = new Date(
  now.getFullYear() - 1,
  now.getMonth(),
  now.getDate(),
);
const oneYearFromNow = new Date(
  now.getFullYear() + 1,
  now.getMonth(),
  now.getDate(),
);
const yesterday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 1,
);

// Mock DataSource factory
const createMockDataSource = (
  assignments: Assignment[],
  responsibles: VehicleResponsible[],
  acls: VehicleACL[],
  userRoles: UserRole[],
): jest.Mocked<DataSource> => {
  const mockDS = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Assignment) {
        return {
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn(async () => assignments[0] || null),
          })),
        } as unknown as Repository<Assignment>;
      }
      if (entity === VehicleResponsible) {
        return {
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn(async () => responsibles[0] || null),
          })),
        } as unknown as Repository<VehicleResponsible>;
      }
      if (entity === VehicleACL) {
        return {
          find: jest.fn(async () => acls),
        } as unknown as Repository<VehicleACL>;
      }
      if (entity === UserRole) {
        return {
          find: jest.fn(async ({ where }) => {
            const userId = (where as { user: { id: string } }).user.id;
            return userRoles.filter((ur) => ur.user?.id === userId);
          }),
        } as unknown as Repository<UserRole>;
      }
      return {} as Repository<unknown>;
    }),
  } as unknown as jest.Mocked<DataSource>;
  return mockDS;
};

// Helper to create assignment
const createAssignment = (
  userId: string,
  vehicleId: string,
  endDate: Date | null,
): Assignment => {
  const assignment = new Assignment();
  assignment.user = { id: userId } as User;
  assignment.vehicle = { id: vehicleId } as Vehicle;
  assignment.startDate = oneYearAgo;
  assignment.endDate = endDate;
  return assignment;
};

// Helper to create responsible
const createResponsible = (
  userId: string,
  vehicleId: string,
  endDate: Date | null,
): VehicleResponsible => {
  const responsible = new VehicleResponsible();
  responsible.user = { id: userId } as User;
  responsible.vehicle = { id: vehicleId } as Vehicle;
  responsible.startDate = oneYearAgo;
  responsible.endDate = endDate;
  return responsible;
};

// Helper to create ACL
const createACL = (
  userId: string | null,
  groupId: string | null,
  vehicleId: string | null,
  selectionId: string | null,
  permission: PermissionType,
): VehicleACL => {
  const acl = new VehicleACL();
  if (userId) acl.user = { id: userId } as User;
  if (groupId) acl.group = { id: groupId } as UserGroup;
  if (vehicleId) acl.vehicle = { id: vehicleId } as Vehicle;
  if (selectionId) acl.selection = { id: selectionId } as VehicleSelection;
  acl.permission = permission;
  return acl;
};

// Helper to create user role
const createUserRole = (userId: string, role: UserRoleEnum): UserRole => {
  const userRole = new UserRole();
  userRole.userId = userId;
  userRole.role = role;
  return userRole;
};

// Helper to create membership
const createMembership = (
  userId: string,
  groupId: string,
): UserGroupMembership => {
  const membership = new UserGroupMembership();
  membership.user = { id: userId } as User;
  membership.group = { id: groupId } as UserGroup;
  return membership;
};

// Helper to create CECO range
const createCecoRange = (
  groupId: string,
  cecoStart: string,
  cecoEnd: string,
): CecoRange => {
  const range = new CecoRange();
  range.group = { id: groupId } as UserGroup;
  range.cecoStart = cecoStart;
  range.cecoEnd = cecoEnd;
  return range;
};

// Helper to create selection
const createSelection = (
  selectionId: string,
  vehicleId: string,
): VehicleSelection => {
  const selection = new VehicleSelection();
  selection.id = selectionId;
  selection.vehicle = { id: vehicleId } as Vehicle;
  return selection;
};

describe("Permission System Unit Tests", () => {
  describe("1. Admin Role", () => {
    test("1.1 Admin has DRIVER access to any vehicle", async () => {
      const mockDS = createMockDataSource(
        [],
        [],
        [],
        [createUserRole(ADMIN_ID, UserRoleEnum.ADMIN)],
        [],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(ADMIN_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("1.2 Admin has FULL access to any vehicle", async () => {
      const mockDS = createMockDataSource(
        [],
        [],
        [],
        [createUserRole(ADMIN_ID, UserRoleEnum.ADMIN)],
        [],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(ADMIN_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(true);
    });

    test("1.3 Admin has READ access to any vehicle", async () => {
      const mockDS = createMockDataSource(
        [],
        [],
        [],
        [createUserRole(ADMIN_ID, UserRoleEnum.ADMIN)],
        [],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(ADMIN_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_MNO345_ID,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });
  });

  describe("2. Current Driver (Assignment-based)", () => {
    test("2.1 Current driver has DRIVER access to assigned vehicle", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_ABC_ID,
        VEHICLE_ABC123_ID,
        null,
      ); // null endDate = current
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("2.2 Current driver has MAINTAINER access (inherited from DRIVER)", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_ABC_ID,
        VEHICLE_ABC123_ID,
        null,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.MAINTAINER,
      });
      expect(result).toBe(true);
    });

    test("2.3 Current driver has READ access (inherited from DRIVER)", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_ABC_ID,
        VEHICLE_ABC123_ID,
        null,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });

    test("2.4 Current driver does NOT have FULL access", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_ABC_ID,
        VEHICLE_ABC123_ID,
        null,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false);
    });

    test("2.5 Another current driver has access to their vehicle", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_DEF_ID,
        VEHICLE_DEF456_ID,
        null,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_DEF_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });
  });

  describe("3. Old Driver (No automatic permission)", () => {
    test("3.1 Old driver does NOT have access (assignment ended)", async () => {
      const pastDate = new Date(2023, 11, 31); // ended in 2023
      const assignment = createAssignment(
        OLD_DRIVER_MNO_ID,
        VEHICLE_MNO345_ID,
        pastDate,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(OLD_DRIVER_MNO_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_MNO345_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("3.2 Old driver CAN have access via group ACL", async () => {
      const pastDate = new Date(2023, 11, 31);
      const assignment = createAssignment(
        OLD_DRIVER_ABC_ID,
        VEHICLE_ABC123_ID,
        pastDate,
      );
      const membership = createMembership(OLD_DRIVER_ABC_ID, DIRECT_GROUP_ID);
      const acl = createACL(
        null,
        DIRECT_GROUP_ID,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource(
        [assignment],
        [],
        [acl],
        [],
        [membership],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(OLD_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });
  });

  describe("4. Current Responsible (FULL permission)", () => {
    test("4.1 Current responsible has FULL access", async () => {
      const responsible = createResponsible(
        RESPONSIBLE_DEF_ID,
        VEHICLE_DEF456_ID,
        null,
      );
      const mockDS = createMockDataSource(
        [],
        [responsible],
        [],
        [],
        [],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(RESPONSIBLE_DEF_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(true);
    });

    test("4.2 Current responsible has DRIVER access (inherited from FULL)", async () => {
      const responsible = createResponsible(
        RESPONSIBLE_DEF_ID,
        VEHICLE_DEF456_ID,
        null,
      );
      const mockDS = createMockDataSource(
        [],
        [responsible],
        [],
        [],
        [],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(RESPONSIBLE_DEF_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("4.3 Another responsible has FULL access to their vehicle", async () => {
      const responsible = createResponsible(
        CURRENT_DRIVER_MNO_ID,
        VEHICLE_MNO345_ID,
        null,
      );
      const mockDS = createMockDataSource(
        [],
        [responsible],
        [],
        [],
        [],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_MNO_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_MNO345_ID,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(true);
    });
  });

  describe("5. Direct User ACL", () => {
    test("5.1 User with direct ACL has DRIVER access", async () => {
      const acl = createACL(
        DIRECT_ACL_ID,
        null,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource([], [], [acl], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(DIRECT_ACL_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("5.2 User with direct ACL on multiple vehicles", async () => {
      const acl = createACL(
        DIRECT_ACL_ID,
        null,
        VEHICLE_DEF456_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource([], [], [acl], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(DIRECT_ACL_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("5.3 Direct ACL grants inherited permissions", async () => {
      const acl = createACL(
        DIRECT_ACL_ID,
        null,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource([], [], [acl], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(DIRECT_ACL_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });

    test("5.4 User does NOT have access to vehicle without ACL", async () => {
      const acl = createACL(
        DIRECT_ACL_ID,
        null,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource([], [], [acl], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(DIRECT_ACL_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_MNO345_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("5.5 Direct ACL does NOT grant higher permissions", async () => {
      const acl = createACL(
        DIRECT_ACL_ID,
        null,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource([], [], [acl], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(DIRECT_ACL_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false);
    });
  });

  describe("6. Group ACL", () => {
    test("6.1 User in group has access via group ACL", async () => {
      const membership = createMembership(OLD_DRIVER_ABC_ID, DIRECT_GROUP_ID);
      const acl = createACL(
        null,
        DIRECT_GROUP_ID,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource(
        [],
        [],
        [acl],
        [],
        [membership],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(OLD_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("6.2 Group ACL applies to multiple vehicles", async () => {
      const membership = createMembership(OLD_DRIVER_ABC_ID, DIRECT_GROUP_ID);
      const acl = createACL(
        null,
        DIRECT_GROUP_ID,
        VEHICLE_DEF456_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource(
        [],
        [],
        [acl],
        [],
        [membership],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(OLD_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("6.3 Group ACL grants inherited permissions", async () => {
      const membership = createMembership(OLD_DRIVER_ABC_ID, DIRECT_GROUP_ID);
      const acl = createACL(
        null,
        DIRECT_GROUP_ID,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource(
        [],
        [],
        [acl],
        [],
        [membership],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(OLD_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });
  });

  describe("7. CECO Range ACL", () => {
    test("7.1 User has access to vehicle in CECO range", async () => {
      const membership = createMembership(RESPONSIBLE_DEF_ID, CECO_GROUP_ID);
      const cecoRange = createCecoRange(CECO_GROUP_ID, "23000000", "23999999");
      const selection = createSelection("sel-1", VEHICLE_DEF456_ID);
      const vehicle = new Vehicle();
      vehicle.id = VEHICLE_DEF456_ID;
      vehicle.ceco = "23000000";
      selection.vehicle = vehicle;
      const acl = createACL(
        null,
        CECO_GROUP_ID,
        null,
        "sel-1",
        PermissionType.DRIVER,
      );

      const mockDS = createMockDataSource(
        [],
        [],
        [acl],
        [],
        [membership],
        [cecoRange],
        [selection],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(RESPONSIBLE_DEF_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(true);
    });

    test("7.2 User does NOT have access to vehicle outside CECO range", async () => {
      const membership = createMembership(RESPONSIBLE_DEF_ID, CECO_GROUP_ID);
      const cecoRange = createCecoRange(CECO_GROUP_ID, "23000000", "23999999");
      const selection = createSelection("sel-1", VEHICLE_MNO345_ID);
      const vehicle = new Vehicle();
      vehicle.id = VEHICLE_MNO345_ID;
      vehicle.ceco = "17001234"; // Outside range
      selection.vehicle = vehicle;
      const acl = createACL(
        null,
        CECO_GROUP_ID,
        null,
        "sel-1",
        PermissionType.DRIVER,
      );

      const mockDS = createMockDataSource(
        [],
        [],
        [acl],
        [],
        [membership],
        [cecoRange],
        [selection],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(RESPONSIBLE_DEF_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_MNO345_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });
  });

  describe("8. No Permissions", () => {
    test("8.1 User with no permissions has NO access", async () => {
      const mockDS = createMockDataSource([], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(NO_PERMISSIONS_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("8.2 Old driver without other permissions has NO access", async () => {
      const pastDate = new Date(2024, 4, 31); // May 2024
      const assignment = createAssignment(
        OLD_DRIVER_MNO_ID,
        VEHICLE_MNO345_ID,
        pastDate,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(OLD_DRIVER_MNO_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_MNO345_ID,
        permission: PermissionType.READ,
      });
      expect(result).toBe(false);
    });
  });

  describe("9. Permission Weight Hierarchy", () => {
    test("9.1 DRIVER permission does NOT grant FULL access", async () => {
      const acl = createACL(
        DIRECT_ACL_ID,
        null,
        VEHICLE_ABC123_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource([], [], [acl], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(DIRECT_ACL_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false);
    });

    test("9.2 Current driver does NOT have FULL access", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_ABC_ID,
        VEHICLE_ABC123_ID,
        null,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_ABC123_ID,
        permission: PermissionType.FULL,
      });
      expect(result).toBe(false);
    });

    test("9.3 FULL permission grants READ access", async () => {
      const responsible = createResponsible(
        RESPONSIBLE_DEF_ID,
        VEHICLE_DEF456_ID,
        null,
      );
      const mockDS = createMockDataSource(
        [],
        [responsible],
        [],
        [],
        [],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(RESPONSIBLE_DEF_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.READ,
      });
      expect(result).toBe(true);
    });

    test("9.4 DRIVER permission grants MAINTAINER access", async () => {
      const membership = createMembership(OLD_DRIVER_ABC_ID, DIRECT_GROUP_ID);
      const acl = createACL(
        null,
        DIRECT_GROUP_ID,
        VEHICLE_DEF456_ID,
        null,
        PermissionType.DRIVER,
      );
      const mockDS = createMockDataSource(
        [],
        [],
        [acl],
        [],
        [membership],
        [],
        [],
      );
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(OLD_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.MAINTAINER,
      });
      expect(result).toBe(true);
    });
  });

  describe("10. Edge Cases", () => {
    test("10.1 Driver does NOT have access to different vehicle", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_ABC_ID,
        VEHICLE_ABC123_ID,
        null,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_ABC_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_DEF456_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });

    test("10.2 Another driver does NOT have access to wrong vehicle", async () => {
      const assignment = createAssignment(
        CURRENT_DRIVER_DEF_ID,
        VEHICLE_DEF456_ID,
        null,
      );
      const mockDS = createMockDataSource([assignment], [], [], [], [], [], []);
      const checker = new PermissionChecker(mockDS);

      const result = await checker.checkUserPermission(CURRENT_DRIVER_DEF_ID, {
        type: "vehicle",
        vehicleId: VEHICLE_MNO345_ID,
        permission: PermissionType.DRIVER,
      });
      expect(result).toBe(false);
    });
  });
});
