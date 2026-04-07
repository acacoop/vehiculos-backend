import { DataSource, In, Repository } from "typeorm";
import { PushToken } from "@/entities/PushToken";
import { IPushTokenRepository } from "@/repositories/interfaces/IPushTokenRepository";

export class PushTokenRepository implements IPushTokenRepository {
  private readonly repo: Repository<PushToken>;

  constructor(ds: DataSource) {
    this.repo = ds.getRepository(PushToken);
  }

  findByUser(userId: string): Promise<PushToken[]> {
    return this.repo.find({ where: { user: { id: userId } } });
  }

  findByToken(token: string): Promise<PushToken | null> {
    return this.repo.findOne({
      where: { token },
      relations: ["user"],
    });
  }

  findByUsers(userIds: string[]): Promise<PushToken[]> {
    return this.repo.find({ where: { user: { id: In(userIds) } } });
  }

  create(data: Partial<PushToken>): PushToken {
    return this.repo.create(data);
  }

  save(entity: PushToken): Promise<PushToken> {
    return this.repo.save(entity);
  }

  deleteByToken(token: string) {
    return this.repo.delete({ token });
  }

  deleteByUser(userId: string) {
    return this.repo
      .createQueryBuilder()
      .delete()
      .where("user_id = :userId", { userId })
      .execute();
  }
}
