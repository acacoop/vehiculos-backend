import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeDateColumnsToDatetime1772735882034
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[assignments]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[assignments]') AND name = 'start_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [assignments] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [assignments]
      ALTER COLUMN [start_date] DATETIME NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[assignments]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[assignments]') AND name = 'end_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [assignments] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [assignments]
      ALTER COLUMN [end_date] DATETIME NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.check_constraints
      WHERE parent_object_id = OBJECT_ID('[vehicle_responsibles]')
      AND definition LIKE '%end_date%start_date%'
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [vehicle_responsibles] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[vehicle_responsibles]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[vehicle_responsibles]') AND name = 'start_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [vehicle_responsibles] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      ALTER COLUMN [start_date] DATETIME NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[vehicle_responsibles]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[vehicle_responsibles]') AND name = 'end_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [vehicle_responsibles] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      ALTER COLUMN [end_date] DATETIME NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      ADD CONSTRAINT [CK_vehicle_responsibles_end_date_after_start_date] 
      CHECK (end_date IS NULL OR end_date > start_date)
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.check_constraints
      WHERE parent_object_id = OBJECT_ID('[maintenances_requirements]')
      AND definition LIKE '%end_date%start_date%'
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [maintenances_requirements] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[maintenances_requirements]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[maintenances_requirements]') AND name = 'start_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [maintenances_requirements] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements]
      ALTER COLUMN [start_date] DATETIME NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[maintenances_requirements]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[maintenances_requirements]') AND name = 'end_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [maintenances_requirements] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements]
      ALTER COLUMN [end_date] DATETIME NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements]
      ADD CONSTRAINT [CK_maintenances_requirements_end_date_after_start_date] 
      CHECK (end_date IS NULL OR end_date >= start_date)
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[maintenance_records]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[maintenance_records]') AND name = 'date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [maintenance_records] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ALTER COLUMN [date] DATETIME NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[quarterly_controls]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[quarterly_controls]') AND name = 'intended_delivery_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [quarterly_controls] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [quarterly_controls]
      ALTER COLUMN [intended_delivery_date] DATETIME NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[quarterly_controls]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[quarterly_controls]') AND name = 'filled_at')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [quarterly_controls] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [quarterly_controls]
      ALTER COLUMN [filled_at] DATETIME NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[assignments]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[assignments]') AND name = 'start_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [assignments] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [assignments]
      ALTER COLUMN [start_date] DATE NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[assignments]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[assignments]') AND name = 'end_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [assignments] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [assignments]
      ALTER COLUMN [end_date] DATE NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      DROP CONSTRAINT [CK_vehicle_responsibles_end_date_after_start_date]
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[vehicle_responsibles]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[vehicle_responsibles]') AND name = 'start_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [vehicle_responsibles] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      ALTER COLUMN [start_date] DATE NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[vehicle_responsibles]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[vehicle_responsibles]') AND name = 'end_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [vehicle_responsibles] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      ALTER COLUMN [end_date] DATE NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      ADD CONSTRAINT [CK_vehicle_responsibles_end_date_after_start_date] 
      CHECK (end_date IS NULL OR end_date > start_date)
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements]
      DROP CONSTRAINT [CK_maintenances_requirements_end_date_after_start_date]
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[maintenances_requirements]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[maintenances_requirements]') AND name = 'start_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [maintenances_requirements] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements]
      ALTER COLUMN [start_date] DATE NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[maintenances_requirements]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[maintenances_requirements]') AND name = 'end_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [maintenances_requirements] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements]
      ALTER COLUMN [end_date] DATE NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenances_requirements]
      ADD CONSTRAINT [CK_maintenances_requirements_end_date_after_start_date] 
      CHECK (end_date IS NULL OR end_date >= start_date)
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[maintenance_records]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[maintenance_records]') AND name = 'date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [maintenance_records] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ALTER COLUMN [date] DATE NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[quarterly_controls]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[quarterly_controls]') AND name = 'intended_delivery_date')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [quarterly_controls] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [quarterly_controls]
      ALTER COLUMN [intended_delivery_date] DATE NOT NULL
    `);

    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('[quarterly_controls]')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('[quarterly_controls]') AND name = 'filled_at')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [quarterly_controls] DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE [quarterly_controls]
      ALTER COLUMN [filled_at] DATE NULL
    `);
  }
}
