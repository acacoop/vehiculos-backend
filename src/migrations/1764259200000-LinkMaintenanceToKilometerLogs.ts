import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkMaintenanceToKilometerLogs1764259200000
  implements MigrationInterface
{
  name = "LinkMaintenanceToKilometerLogs1764259200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add kilometers_log_id column to maintenance_records table
    await queryRunner.query(`
      ALTER TABLE [maintenance_records] 
      ADD [kilometers_log_id] uniqueidentifier NULL
    `);

    // Add kilometers_log_id column to quarterly_controls table
    await queryRunner.query(`
      ALTER TABLE [quarterly_controls] 
      ADD [kilometers_log_id] uniqueidentifier NULL
    `);

    // Add foreign key constraint for maintenance_records -> vehicle_kilometers
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD CONSTRAINT [FK_maintenance_records_kilometers_log]
      FOREIGN KEY ([kilometers_log_id]) 
      REFERENCES [vehicle_kilometers]([id]) 
      ON DELETE NO ACTION
    `);

    // Add foreign key constraint for quarterly_controls -> vehicle_kilometers
    await queryRunner.query(`
      ALTER TABLE [quarterly_controls]
      ADD CONSTRAINT [FK_quarterly_controls_kilometers_log]
      FOREIGN KEY ([kilometers_log_id]) 
      REFERENCES [vehicle_kilometers]([id]) 
      ON DELETE NO ACTION
    `);

    // Drop the old kilometers column from maintenance_records since entity no longer has it
    await queryRunner.query(`
      ALTER TABLE [maintenance_records] DROP CONSTRAINT IF EXISTS [CK__maintenan__kilom__66603565]
    `);
    await queryRunner.query(`
      ALTER TABLE [maintenance_records] DROP COLUMN [kilometers]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the kilometers column
    await queryRunner.query(`
      ALTER TABLE [maintenance_records] ADD [kilometers] int NOT NULL DEFAULT 0
    `);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP CONSTRAINT [FK_maintenance_records_kilometers_log]
    `);

    await queryRunner.query(`
      ALTER TABLE [quarterly_controls]
      DROP CONSTRAINT [FK_quarterly_controls_kilometers_log]
    `);

    // Drop the columns
    await queryRunner.query(`
      ALTER TABLE [maintenance_records] 
      DROP COLUMN [kilometers_log_id]
    `);

    await queryRunner.query(`
      ALTER TABLE [quarterly_controls] 
      DROP COLUMN [kilometers_log_id]
    `);
  }
}
