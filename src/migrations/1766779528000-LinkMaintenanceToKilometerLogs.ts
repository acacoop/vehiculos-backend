import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkMaintenanceToKilometerLogs1766779528000 implements MigrationInterface {
  name = "LinkMaintenanceToKilometerLogs1766779528000";

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
    // Using NO ACTION instead of SET NULL to avoid multiple cascade paths error in SQL Server
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD CONSTRAINT [FK_maintenance_records_kilometers_log]
      FOREIGN KEY ([kilometers_log_id]) 
      REFERENCES [vehicle_kilometers]([id]) 
      ON DELETE NO ACTION
    `);

    // Add foreign key constraint for quarterly_controls -> vehicle_kilometers
    // Using NO ACTION instead of SET NULL to avoid multiple cascade paths error in SQL Server
    await queryRunner.query(`
      ALTER TABLE [quarterly_controls]
      ADD CONSTRAINT [FK_quarterly_controls_kilometers_log]
      FOREIGN KEY ([kilometers_log_id]) 
      REFERENCES [vehicle_kilometers]([id]) 
      ON DELETE NO ACTION
    `);

    // Migrate existing kilometers data from maintenance_records to vehicle_kilometers
    // This prevents data loss by creating vehicle_kilometers entries for existing records
    await queryRunner.query(`
      INSERT INTO [vehicle_kilometers] ([id], [vehicle_id], [user_id], [date], [kilometers])
      SELECT 
        NEWID() as [id],
        mr.[vehicle_id],
        mr.[user_id],
        CAST(mr.[date] AS datetime) as [date],
        mr.[kilometers]
      FROM [maintenance_records] mr
      WHERE mr.[kilometers] IS NOT NULL
    `);

    // Link maintenance_records to the newly created vehicle_kilometers entries
    await queryRunner.query(`
      UPDATE mr
      SET mr.[kilometers_log_id] = vk.[id]
      FROM [maintenance_records] mr
      INNER JOIN [vehicle_kilometers] vk ON 
        vk.[vehicle_id] = mr.[vehicle_id] AND
        vk.[user_id] = mr.[user_id] AND
        CAST(vk.[date] AS date) = mr.[date] AND
        vk.[kilometers] = mr.[kilometers]
      WHERE mr.[kilometers] IS NOT NULL
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
      ALTER TABLE [maintenance_records] ADD [kilometers] int NULL
    `);

    // Restore kilometers data from vehicle_kilometers back to maintenance_records
    await queryRunner.query(`
      UPDATE mr
      SET mr.[kilometers] = vk.[kilometers]
      FROM [maintenance_records] mr
      INNER JOIN [vehicle_kilometers] vk ON vk.[id] = mr.[kilometers_log_id]
      WHERE mr.[kilometers_log_id] IS NOT NULL
    `);

    // Make kilometers NOT NULL after restoring data
    await queryRunner.query(`
      ALTER TABLE [maintenance_records] ALTER COLUMN [kilometers] int NOT NULL
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

    // Delete migrated vehicle_kilometers entries
    // Only delete those that were created during the up migration
    // (matched by vehicle, user, date, and kilometers from maintenance_records)
    await queryRunner.query(`
      DELETE vk
      FROM [vehicle_kilometers] vk
      INNER JOIN [maintenance_records] mr ON 
        vk.[vehicle_id] = mr.[vehicle_id] AND
        vk.[user_id] = mr.[user_id] AND
        CAST(vk.[date] AS date) = mr.[date] AND
        vk.[kilometers] = mr.[kilometers]
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
