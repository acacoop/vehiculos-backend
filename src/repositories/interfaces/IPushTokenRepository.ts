import { PushToken } from "@/entities/PushToken";
import { DeleteResult } from "typeorm";

export interface IPushTokenRepository {
  findByUser(userId: string): Promise<PushToken[]>;
  findByToken(token: string): Promise<PushToken | null>;
  findByUsers(userIds: string[]): Promise<PushToken[]>;
  save(entity: PushToken): Promise<PushToken>;
  create(data: Partial<PushToken>): PushToken;
  deleteByToken(token: string): Promise<DeleteResult>;
  deleteByUser(userId: string): Promise<DeleteResult>;
}
