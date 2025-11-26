import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeMaintenanceChecklistItemPassedToStatus1764082698036
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new status column
    await queryRunner.query(`
      ALTER TABLE maintenance_checklist_items
      ADD status NVARCHAR(50) DEFAULT 'PENDIENTE' NOT NULL
    `);

    // Migrate data: passed=true -> APROBADO, passed=false -> RECHAZADO
    await queryRunner.query(`
      UPDATE maintenance_checklist_items
      SET status = CASE
        WHEN passed = 1 THEN 'APROBADO'
        WHEN passed = 0 THEN 'RECHAZADO'
        ELSE 'PENDIENTE'
      END
    `);

    // Drop old passed column
    // First drop the index
    await queryRunner.query(`
      DROP INDEX IDX_mci_passed ON maintenance_checklist_items
    `);

    // Then drop the default constraint
    await queryRunner.query(`
      DECLARE @ConstraintName nvarchar(200)
      SELECT @ConstraintName = Name FROM sys.default_constraints
      WHERE parent_object_id = OBJECT_ID('maintenance_checklist_items')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('maintenance_checklist_items') AND name = 'passed')
      IF @ConstraintName IS NOT NULL
      EXEC('ALTER TABLE maintenance_checklist_items DROP CONSTRAINT ' + @ConstraintName)
    `);

    await queryRunner.query(`
      ALTER TABLE maintenance_checklist_items
      DROP COLUMN passed
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back passed column
    await queryRunner.query(`
      ALTER TABLE maintenance_checklist_items
      ADD passed BIT DEFAULT 0 NOT NULL
    `);

    // Migrate data back: APROBADO -> true, RECHAZADO/PENDIENTE -> false
    await queryRunner.query(`
      UPDATE maintenance_checklist_items
      SET passed = CASE
        WHEN status = 'APROBADO' THEN 1
        ELSE 0
      END
    `);

    // Drop status column
    await queryRunner.query(`
      ALTER TABLE maintenance_checklist_items
      DROP COLUMN status
    `);
  }
}
