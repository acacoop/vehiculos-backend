import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMaintenanceRequirementsToModelLevel1762970419764
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a temporary column for the new model_id (SQL Server syntax)
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      ADD [model_id] uniqueidentifier NULL
    `);

    // Populate model_id from vehicles.model_id based on existing vehicle_id
    await queryRunner.query(`
      UPDATE mr
      SET mr.[model_id] = v.[model_id]
      FROM [maintenances_requirements] mr
      INNER JOIN [vehicles] v ON mr.[vehicle_id] = v.[id]
    `);

    // Drop the foreign key constraint on vehicle_id (FK_mr_vehicle from the first migration)
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_mr_vehicle')
      ALTER TABLE [maintenances_requirements] 
      DROP CONSTRAINT [FK_mr_vehicle]
    `);

    // Drop the index on vehicle_id
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_mr_vehicle_id')
      DROP INDEX [IDX_mr_vehicle_id] ON [maintenances_requirements]
    `);

    // Drop the old vehicle_id column
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      DROP COLUMN [vehicle_id]
    `);

    // Make model_id NOT NULL (SQL Server syntax)
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      ALTER COLUMN [model_id] uniqueidentifier NOT NULL
    `);

    // Add foreign key constraint for model_id
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      ADD CONSTRAINT [FK_mr_model] 
      FOREIGN KEY ([model_id]) 
      REFERENCES [vehicle_models]([id]) 
      ON DELETE CASCADE
    `);

    // Create index on model_id for better query performance
    await queryRunner.query(`
      CREATE INDEX [IDX_mr_model_id] 
      ON [maintenances_requirements] ([model_id])
    `);

    // Create unique constraint to prevent duplicate maintenance requirements per model
    // SQL Server doesn't support WHERE in unique indexes, so we create a filtered index
    await queryRunner.query(`
      CREATE UNIQUE INDEX [IDX_unique_maintenance_per_model] 
      ON [maintenances_requirements] ([model_id], [maintenance_id], [start_date]) 
      WHERE [end_date] IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_unique_maintenance_per_model')
      DROP INDEX [IDX_unique_maintenance_per_model] ON [maintenances_requirements]
    `);

    // Drop the index on model_id
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_mr_model_id')
      DROP INDEX [IDX_mr_model_id] ON [maintenances_requirements]
    `);

    // Add back vehicle_id column
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      ADD [vehicle_id] uniqueidentifier NULL
    `);

    // Note: We cannot reliably restore the original vehicle_id mappings
    // as multiple vehicles may share the same model_id
    // This down migration will result in data loss

    // Drop the foreign key constraint on model_id
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_mr_model')
      ALTER TABLE [maintenances_requirements] 
      DROP CONSTRAINT [FK_mr_model]
    `);

    // Drop the model_id column
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      DROP COLUMN [model_id]
    `);

    // Make vehicle_id NOT NULL
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      ALTER COLUMN [vehicle_id] uniqueidentifier NOT NULL
    `);

    // Add back foreign key constraint for vehicle_id
    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements] 
      ADD CONSTRAINT [FK_mr_vehicle] 
      FOREIGN KEY ([vehicle_id]) 
      REFERENCES [vehicles]([id]) 
      ON DELETE CASCADE
    `);

    // Recreate index on vehicle_id
    await queryRunner.query(`
      CREATE INDEX [IDX_mr_vehicle_id] ON [maintenances_requirements] ([vehicle_id])
    `);
  }
}
