import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add DEFAULT (GETDATE()) constraints for start_date columns that were missing after
 * the 1772735882034-ChangeDateColumnsToDatetime migration.
 *
 * The previous migration dropped the default constraints when altering column types
 * but did not recreate them, which breaks inserts that omit start_date.
 */
export class AddDefaultConstraintsForStartDates1772829089952 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add DEFAULT constraint for assignments.start_date
    await queryRunner.query(`
      ALTER TABLE [assignments]
      ADD CONSTRAINT [DF_assignments_start_date] DEFAULT (GETDATE()) FOR [start_date]
    `);

    // Add DEFAULT constraint for vehicle_responsibles.start_date
    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      ADD CONSTRAINT [DF_vehicle_responsibles_start_date] DEFAULT (GETDATE()) FOR [start_date]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop DEFAULT constraint for assignments.start_date
    await queryRunner.query(`
      ALTER TABLE [assignments]
      DROP CONSTRAINT [DF_assignments_start_date]
    `);

    // Drop DEFAULT constraint for vehicle_responsibles.start_date
    await queryRunner.query(`
      ALTER TABLE [vehicle_responsibles]
      DROP CONSTRAINT [DF_vehicle_responsibles_start_date]
    `);
  }
}
