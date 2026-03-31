import { PushToken } from "@/entities/PushToken";
import { User } from "@/entities/User";
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
    if (!user) throw new Error("USER_NOT_FOUND");

    // Check if this token already exists
    const existing = await this.pushTokenRepo.findByToken(token);
    if (existing) {
      // Update: reassign to current user and update platform
      existing.user = user;
      existing.platform = platform;
      return this.pushTokenRepo.save(existing);
    }

    // Create new
    const entity = this.pushTokenRepo.create({ user, token, platform });
    return this.pushTokenRepo.save(entity);
  }

  async unregisterToken(token: string): Promise<boolean> {
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

  async deleteByUser(userId: string): Promise<boolean> {
    const result = await this.pushTokenRepo.deleteByUser(userId);
    return (result.affected ?? 0) > 0;
  }
}
