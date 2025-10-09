import { DataSource } from "typeorm";
import { PermissionType } from "../../entities/authorization/PermissionType";
import { UserRoleEnum } from "../../entities/authorization/UserRoleEnum";
import { VehicleACL } from "../../entities/authorization/VehicleACL";
import { ACLType } from "../../entities/authorization/VehicleACL";
import { PERMISSION_WEIGHT } from "../../entities/authorization/PermissionType";
import { VehicleSelection } from "../../entities/authorization/VehicleSelection";
import { AssignmentRepository } from "../../repositories/AssignmentRepository";
import { VehicleACLRepository } from "../../repositories/VehicleACLRepository";
import { UserGroupMembershipRepository } from "../../repositories/UserGroupMembershipRepository";
import { UserGroupNestingRepository } from "../../repositories/UserGroupNestingRepository";
import { VehicleResponsibleRepository } from "../../repositories/VehicleResponsibleRepository";
import { CecoRangeRepository } from "../../repositories/CecoRangeRepository";
import { UserRoleRepository } from "../../repositories/UserRoleRepository";
import {
  VehiclePermissionCheckOptions,
  RoleCheckOptions,
  PermissionCheckOptions,
} from "./types";

/**
 * Core permission checking service for vehicle access control.
 *
 * Handles multi-layered permission checks:
 * 1. Admin role check (grants FULL access)
 * 2. Current driver check (grants DRIVER permission)
 * 3. Current responsible check (grants FULL permission)
 * 4. Direct user ACLs
 * 5. Group ACLs (including nested groups)
 * 6. CECO range-based ACLs
 */
export class PermissionChecker {
  private assignmentRepo: AssignmentRepository;
  private vehicleACLRepo: VehicleACLRepository;
  private userGroupMembershipRepo: UserGroupMembershipRepository;
  private userGroupNestingRepo: UserGroupNestingRepository;
  private vehicleResponsiblesRepo: VehicleResponsibleRepository;
  private cecoRangesRepo: CecoRangeRepository;
  private userRoleRepo: UserRoleRepository;

  constructor(dataSource: DataSource) {
    this.assignmentRepo = new AssignmentRepository(dataSource);
    this.vehicleACLRepo = new VehicleACLRepository(dataSource);
    this.userGroupMembershipRepo = new UserGroupMembershipRepository(
      dataSource,
    );
    this.userGroupNestingRepo = new UserGroupNestingRepository(dataSource);
    this.vehicleResponsiblesRepo = new VehicleResponsibleRepository(dataSource);
    this.cecoRangesRepo = new CecoRangeRepository(dataSource);
    this.userRoleRepo = new UserRoleRepository(dataSource);
  }

  /**
   * Recursively gets all parent group IDs for a given group.
   * Used to resolve nested group hierarchies for permission inheritance.
   */
  private async getParentsGroupIds(groupId: string): Promise<Set<string>> {
    const groupIds = new Set<string>([groupId]);

    const nestedGroup = await this.userGroupNestingRepo.findOne(groupId);

    if (!nestedGroup) {
      return groupIds;
    }

    const parentGroupIds = await this.getParentsGroupIds(
      nestedGroup.parentGroup.id,
    );
    parentGroupIds.forEach((id) => groupIds.add(id));

    return groupIds;
  }

  /**
   * Checks if a vehicle matches a VehicleSelection.
   * Matches by direct vehicle ID or by CECO range.
   */
  private async checkVehicleInSelection(
    vehicleId: string,
    ceco: string | null,
    selection: VehicleSelection,
  ): Promise<boolean> {
    // Direct vehicle match
    if (selection.vehicles.some((v) => v.id === vehicleId)) {
      return true;
    }

    if (!ceco) return false;

    // CECO range match
    const [cecoRanges, _] = await this.cecoRangesRepo.findAndCount({
      searchParams: { vehicleSelectionId: selection.id },
    });

    for (const range of cecoRanges) {
      const start = Number(range.startCeco);
      const end = Number(range.endCeco);
      const cecoNum = Number(ceco);
      if (cecoNum >= start && cecoNum <= end) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets the current CECO for a vehicle based on its current responsible.
   */
  private async getVehicleCeco(vehicleId: string): Promise<string | null> {
    const responsible = await this.vehicleResponsiblesRepo.find({
      searchParams: {
        vehicleId,
        date: new Date().toISOString(),
      },
    });

    if (responsible[1] === 0) {
      return null;
    }

    return responsible[0][0].ceco || null;
  }

  /**
   * Checks if an ACL grants sufficient permission for a vehicle.
   */
  private async checkACLPermission(
    acl: VehicleACL,
    vehicleId: string,
    vehicleCeco: string | null,
    requiredWeight: number,
  ): Promise<boolean> {
    if (PERMISSION_WEIGHT[acl.permission] < requiredWeight) {
      return false;
    }

    return this.checkVehicleInSelection(
      vehicleId,
      vehicleCeco,
      acl.vehicleSelection,
    );
  }

  /**
   * Checks if user is currently assigned as driver for a vehicle.
   * Active assignments grant DRIVER permission automatically.
   */
  private async isCurrentDriver(
    userId: string,
    vehicleId: string,
  ): Promise<boolean> {
    return this.assignmentRepo.hasActiveAssignment(userId, vehicleId);
  }

  /**
   * Checks if user is currently responsible for a vehicle.
   * Active responsibles grant FULL permission automatically.
   */
  private async isCurrentResponsible(
    userId: string,
    vehicleId: string,
  ): Promise<boolean> {
    const now = new Date();
    const [_, count] = await this.vehicleResponsiblesRepo.find({
      searchParams: {
        vehicleId,
        userId,
        date: now.toISOString(),
      },
    });
    return count > 0;
  }

  /**
   * Checks if user has a specific role (e.g., ADMIN).
   */
  private async hasRole(userId: string, role: UserRoleEnum): Promise<boolean> {
    return this.userRoleRepo.hasActiveRole(userId, role);
  }

  /**
   * Main vehicle permission check logic.
   * Checks permissions in order of precedence:
   * 1. Admin role (grants FULL)
   * 2. Current driver (grants DRIVER)
   * 3. Current responsible (grants FULL)
   * 4. Direct user ACLs
   * 5. Group ACLs (including nested groups)
   */
  private async checkUserVehiclePermission(
    userId: string,
    vehicleId: string,
    requiredPermission: PermissionType,
  ): Promise<boolean> {
    // 1. Check if user is admin
    if (await this.hasRole(userId, UserRoleEnum.ADMIN)) return true;

    const requiredWeight = PERMISSION_WEIGHT[requiredPermission];
    const vehicleCeco = await this.getVehicleCeco(vehicleId);

    // 2. Check if user is current driver (grants DRIVER permission)
    if (requiredWeight <= PERMISSION_WEIGHT[PermissionType.DRIVER]) {
      const isDriver = await this.isCurrentDriver(userId, vehicleId);
      if (isDriver) return true;
    }

    // 3. Check if user is current responsible (grants FULL permission)
    const isResponsible = await this.isCurrentResponsible(userId, vehicleId);
    if (isResponsible) return true;

    // 4. Get the ACLs directly assigned to the user
    const [userACLs, __] = await this.vehicleACLRepo.findAndCount({
      searchParams: {
        aclType: ACLType.USER,
        entityId: userId,
      },
    });

    // 5. Get user's groups (including nested parent groups)
    const userGroups = await this.userGroupMembershipRepo.findAndCount({
      searchParams: { userId },
    });
    const groupIds = userGroups[0].map((ugm) => ugm.userGroup.id);
    const allGroupIds = new Set<string>(groupIds);

    // Resolve nested group hierarchy
    for (const groupId of groupIds) {
      const parentGroupIds = await this.getParentsGroupIds(groupId);
      parentGroupIds.forEach((id) => allGroupIds.add(id));
    }

    // 6. Get ACLs for all groups (direct and nested)
    const groupACLs = [];
    for (const groupId of allGroupIds) {
      const [groupACL, _] = await this.vehicleACLRepo.findAndCount({
        searchParams: {
          aclType: ACLType.USER_GROUP,
          entityId: groupId,
        },
      });
      groupACLs.push(...groupACL);
    }

    // Check all ACLs (user + group)
    const allACLs = [...userACLs, ...groupACLs];

    for (const acl of allACLs) {
      const hasPermission = await this.checkACLPermission(
        acl,
        vehicleId,
        vehicleCeco,
        requiredWeight,
      );
      if (hasPermission) return true;
    }

    return false;
  }

  /**
   * Checks vehicle-specific permissions.
   */
  private async checkVehiclePermission(
    userId: string,
    options: VehiclePermissionCheckOptions,
  ): Promise<boolean> {
    // Check if user is admin
    if (await this.hasRole(userId, UserRoleEnum.ADMIN)) return true;

    return this.checkUserVehiclePermission(
      userId,
      options.vehicleId,
      options.permission,
    );
  }

  /**
   * Checks role-based permissions.
   */
  private async checkRole(
    userId: string,
    options: RoleCheckOptions,
  ): Promise<boolean> {
    return this.hasRole(userId, options.role);
  }

  /**
   * Main entry point for permission checking.
   * Routes to appropriate check based on permission type.
   */
  async checkUserPermission(
    userId: string,
    options: PermissionCheckOptions,
  ): Promise<boolean> {
    switch (options.type) {
      case "vehicle":
        return this.checkVehiclePermission(userId, options);
      case "role":
        return this.checkRole(userId, options);
      default:
        return false;
    }
  }
}
