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

    // Add kilometers_log_id column to maintenance_checklists table
    await queryRunner.query(`
      ALTER TABLE [maintenance_checklists] 
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

    // Add foreign key constraint for maintenance_checklists -> vehicle_kilometers
    await queryRunner.query(`
      ALTER TABLE [maintenance_checklists]
      ADD CONSTRAINT [FK_maintenance_checklists_kilometers_log]
      FOREIGN KEY ([kilometers_log_id]) 
      REFERENCES [vehicle_kilometers]([id]) 
      ON DELETE NO ACTION
    `);

    // Note: The vehicle_kilometers table uses datetime for the date column,
    // which means the unique constraint is per vehicle per datetime (not just date).
    // This allows multiple readings per day for the same vehicle.
    //
    // We cannot migrate existing data automatically because:
    // 1. maintenance_records.kilometers is a plain number, not linked to a log entry
    // 2. We would need to create new vehicle_kilometers entries for each existing record
    // 3. This would require knowing the exact date/time of each reading
    //
    // Manual migration steps if you have existing data:
    // 1. For each maintenance_record, create a corresponding vehicle_kilometers entry
    // 2. Link the maintenance_record to the new vehicle_kilometers entry
    // 3. Then drop the old kilometers column
    //
    // For now, we'll leave the old kilometers column in place to avoid data loss.
    // In a future migration, once all records are migrated, we can drop it.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP CONSTRAINT [FK_maintenance_records_kilometers_log]
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_checklists]
      DROP CONSTRAINT [FK_maintenance_checklists_kilometers_log]
    `);

    // Drop the columns
    await queryRunner.query(`
      ALTER TABLE [maintenance_records] 
      DROP COLUMN [kilometers_log_id]
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_checklists] 
      DROP COLUMN [kilometers_log_id]
    `);
  }
}
