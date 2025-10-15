import { UserRoleRepository } from "../repositories/UserRoleRepository";
import { UserRole } from "../entities/UserRole";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import { AppError } from "../middleware/errorHandler";
import { UserRoleEnum } from "../utils/common";

export interface UserRoleDTO {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRoleEnum;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

export class UserRolesService {
  constructor(
    private readonly userRoleRepo: UserRoleRepository,
    private readonly userRepo: Repository<User>,
  ) {}

  private mapToDTO(userRole: UserRole): UserRoleDTO {
    const now = new Date();
    const isActive =
      userRole.startTime <= now &&
      (!userRole.endTime || userRole.endTime > now);

    return {
      id: userRole.id,
      userId: userRole.user.id,
      userEmail: userRole.user.email || "",
      userName: `${userRole.user.firstName} ${userRole.user.lastName}`.trim(),
      role: userRole.role,
      startTime: userRole.startTime,
      endTime: userRole.endTime,
      isActive,
    };
  }

  async getAll(options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    role?: UserRoleEnum;
    activeOnly?: boolean;
  }): Promise<{ items: UserRoleDTO[]; total: number }> {
    const [userRoles, total] = await this.userRoleRepo.findAndCount({
      limit: options?.limit,
      offset: options?.offset,
      searchParams: {
        userId: options?.userId,
        role: options?.role,
        activeOnly: options?.activeOnly,
      },
    });

    return {
      items: userRoles.map((ur) => this.mapToDTO(ur)),
      total,
    };
  }

  async getById(id: string): Promise<UserRoleDTO | null> {
    const userRole = await this.userRoleRepo.findOne(id);
    return userRole ? this.mapToDTO(userRole) : null;
  }

  async getByUserId(userId: string): Promise<UserRoleDTO[]> {
    const userRoles = await this.userRoleRepo.findByUserId(userId);
    return userRoles.map((ur) => this.mapToDTO(ur));
  }

  async getActiveByUserId(userId: string): Promise<UserRoleDTO | null> {
    const userRole = await this.userRoleRepo.findActiveByUserId(userId);
    return userRole ? this.mapToDTO(userRole) : null;
  }

  async create(data: {
    userId: string;
    role: UserRoleEnum;
    startTime: Date;
    endTime?: Date | null;
  }): Promise<UserRoleDTO> {
    // Validate user exists
    const user = await this.userRepo.findOne({ where: { id: data.userId } });
    if (!user) {
      throw new AppError(
        "User not found",
        404,
        "https://example.com/problems/not-found",
        "Not Found",
      );
    }

    // Validate dates
    if (data.endTime && data.endTime <= data.startTime) {
      throw new AppError(
        "End time must be after start time",
        400,
        "https://example.com/problems/validation-error",
        "Validation Error",
      );
    }

    const userRole = this.userRoleRepo.create({
      user,
      role: data.role,
      startTime: data.startTime,
      endTime: data.endTime || undefined,
    });

    const saved = await this.userRoleRepo.save(userRole);
    return this.mapToDTO(saved);
  }

  async update(
    id: string,
    data: {
      role?: UserRoleEnum;
      startTime?: Date;
      endTime?: Date | null;
    },
  ): Promise<UserRoleDTO | null> {
    const userRole = await this.userRoleRepo.findOne(id);
    if (!userRole) {
      return null;
    }

    if (data.role !== undefined) {
      userRole.role = data.role;
    }
    if (data.startTime !== undefined) {
      userRole.startTime = data.startTime;
    }
    if (data.endTime !== undefined) {
      userRole.endTime = data.endTime || undefined;
    }

    // Validate dates
    if (userRole.endTime && userRole.endTime <= userRole.startTime) {
      throw new AppError(
        "End time must be after start time",
        400,
        "https://example.com/problems/validation-error",
        "Validation Error",
      );
    }

    const saved = await this.userRoleRepo.save(userRole);
    return this.mapToDTO(saved);
  }

  async endRole(id: string, endTime?: Date): Promise<UserRoleDTO | null> {
    const userRole = await this.userRoleRepo.endRole(id, endTime);
    return userRole ? this.mapToDTO(userRole) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRoleRepo.delete(id);
    return (result.affected || 0) > 0;
  }
}
