import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePushTokens1775000000000 implements MigrationInterface {
  name = "CreatePushTokens1775000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [push_tokens] (
        [id] uniqueidentifier NOT NULL DEFAULT NEWSEQUENTIALID(),
        [user_id] uniqueidentifier NOT NULL,
        [token] nvarchar(255) NOT NULL,
        [platform] nvarchar(10) NOT NULL,
        [created_at] datetime2 NOT NULL DEFAULT GETDATE(),
        [updated_at] datetime2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_push_tokens] PRIMARY KEY ([id]),
        CONSTRAINT [UQ_push_tokens_token] UNIQUE ([token]),
        CONSTRAINT [FK_push_tokens_user] FOREIGN KEY ([user_id])
          REFERENCES [users]([id]) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_push_tokens_user_id] ON [push_tokens] ([user_id])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX [IDX_push_tokens_user_id] ON [push_tokens]
    `);
    await queryRunner.query(`DROP TABLE [push_tokens]`);
  }
}
