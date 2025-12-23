import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeReservationDatesToDatetime1764344171698
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the index on start_date
    await queryRunner.query(`
      DROP INDEX [IDX_c62a4f9425f4f612a5f49d7002] ON [reservations]
    `);

    // Drop the check constraint
    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.check_constraints
      WHERE parent_object_id = OBJECT_ID('[reservations]')
      AND definition LIKE '%end_date%start_date%'
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE [reservations] DROP CONSTRAINT ' + @ConstraintName)
    `);

    // Change start_date from date to datetime
    await queryRunner.query(`
      ALTER TABLE [reservations]
      ALTER COLUMN [start_date] DATETIME NOT NULL
    `);

    // Change end_date from date to datetime
    await queryRunner.query(`
      ALTER TABLE [reservations]
      ALTER COLUMN [end_date] DATETIME NOT NULL
    `);

    // Recreate the check constraint
    await queryRunner.query(`
      ALTER TABLE [reservations]
      ADD CONSTRAINT [CK_reservations_end_date_after_start_date] 
      CHECK (end_date > start_date)
    `);

    // Recreate the index on start_date
    await queryRunner.query(`
      CREATE INDEX [IDX_c62a4f9425f4f612a5f49d7002] 
      ON [reservations]([start_date])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index on start_date
    await queryRunner.query(`
      DROP INDEX [IDX_c62a4f9425f4f612a5f49d7002] ON [reservations]
    `);

    // Drop the check constraint
    await queryRunner.query(`
      ALTER TABLE [reservations]
      DROP CONSTRAINT [CK_reservations_end_date_after_start_date]
    `);

    // Revert start_date from datetime to date
    await queryRunner.query(`
      ALTER TABLE [reservations]
      ALTER COLUMN [start_date] DATE NOT NULL
    `);

    // Revert end_date from datetime to date
    await queryRunner.query(`
      ALTER TABLE [reservations]
      ALTER COLUMN [end_date] DATE NOT NULL
    `);

    // Recreate the check constraint
    await queryRunner.query(`
      ALTER TABLE [reservations]
      ADD CONSTRAINT [CK_reservations_end_date_after_start_date] 
      CHECK (end_date > start_date)
    `);

    // Recreate the index on start_date
    await queryRunner.query(`
      CREATE INDEX [IDX_c62a4f9425f4f612a5f49d7002] 
      ON [reservations]([start_date])
    `);
  }
}
