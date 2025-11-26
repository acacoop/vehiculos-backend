import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupAssignedMaintenances1764100800000
  implements MigrationInterface
{
  name = "CleanupAssignedMaintenances1764100800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the leftover table assigned_maintenances
    // We check if it exists first to be safe, although Baseline creates it.
    // Since Baseline creates it, we know it exists.
    await queryRunner.query(`DROP TABLE [assigned_maintenances]`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate assigned_maintenances if we revert
    await queryRunner.query(`
      CREATE TABLE [assigned_maintenances] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [kilometers_frequency] int NULL,
        [days_frequency] int NULL,
        [observations] text NULL,
        [instructions] text NULL,
        [vehicle_id] uniqueidentifier NULL,
        [maintenance_id] uniqueidentifier NULL,
        CONSTRAINT [PK_d189a1b550bed247f0fdd0159eb] PRIMARY KEY ([id]),
        CONSTRAINT [FK_7241f9b919f6ff9688930785335] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_de57a116d3f8b7eaeb41a6def40] FOREIGN KEY ([maintenance_id]) REFERENCES [maintenances]([id]) ON DELETE CASCADE
      )
    `);
  }
}
