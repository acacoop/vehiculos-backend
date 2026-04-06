import { PushToken } from "@/entities/PushToken";
import { User } from "@/entities/User";
import { AppError } from "@/middleware/errorHandler";
import { IPushTokenRepository } from "@/repositories/interfaces/IPushTokenRepository";
import { Repository } from "typeorm";

export class PushTokenService {
  constructor(
    private readonly pushTokenRepo: IPushTokenRepository,
    private readonly userRepo: Repository<User>,
  ) {}

  async registerToken(
    userId: string,
    token: string,
    platform: string,
  ): Promise<PushToken> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    // Check if this token already exists
    const existing = await this.pushTokenRepo.findByToken(token);
    if (existing) {
      // Only allow reassignment if the token already belongs to the same user
      if (existing.user.id !== userId) {
        throw new AppError(
          "This token is registered to another user. Please use a new token.",
          409,
        );
      }
      // Update platform only
      existing.platform = platform;
      return this.pushTokenRepo.save(existing);
    }

    // Create new
    const entity = this.pushTokenRepo.create({ user, token, platform });
    return this.pushTokenRepo.save(entity);
  }

  async unregisterToken(token: string, userId: string): Promise<boolean> {
    // Load the token to verify ownership before deletion
    const existing = await this.pushTokenRepo.findByToken(token);
    if (!existing) return false;

    // Verify the token belongs to the authenticated user
    if (existing.user.id !== userId) {
      throw new AppError(
        "Cannot unregister a token that does not belong to you",
        403,
      );
    }

    const result = await this.pushTokenRepo.deleteByToken(token);
    return (result.affected ?? 0) > 0;
  }

  async getTokensByUser(userId: string): Promise<PushToken[]> {
    return this.pushTokenRepo.findByUser(userId);
  }

  async getTokensByUsers(userIds: string[]): Promise<PushToken[]> {
    if (!userIds.length) return [];
    return this.pushTokenRepo.findByUsers(userIds);
  }

  /**
   * Internal server-side cleanup of a token (e.g. DeviceNotRegistered from Expo).
   * No ownership check — do NOT expose this through a user-facing HTTP endpoint.
   */
  async deleteTokenByValue(token: string): Promise<boolean> {
    const result = await this.pushTokenRepo.deleteByToken(token);
    return (result.affected ?? 0) > 0;
  }

  async deleteByUser(userId: string): Promise<boolean> {
    const result = await this.pushTokenRepo.deleteByUser(userId);
    return (result.affected ?? 0) > 0;
  }
}
