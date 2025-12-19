import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleRegistrationDate1764600000000
  implements MigrationInterface
{
  name = "AddVehicleRegistrationDate1764600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column as nullable first
    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD registration_date DATE NULL
    `);

    // Set default value for existing records
    await queryRunner.query(`
      UPDATE vehicles
      SET registration_date = '2026-01-01'
      WHERE registration_date IS NULL
    `);

    // Make the column NOT NULL
    await queryRunner.query(`
      ALTER TABLE vehicles
      ALTER COLUMN registration_date DATE NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP COLUMN registration_date
    `);
  }
}
