import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameChecklistsToQuarterlyControls1764500000000
  implements MigrationInterface
{
  name = "RenameChecklistsToQuarterlyControls1764500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint from items table first
    await queryRunner.query(`
      ALTER TABLE [maintenance_checklist_items] 
      DROP CONSTRAINT [FK_maintenance_checklist_items_maintenance_checklist_id]
    `);

    // Rename the tables
    await queryRunner.query(
      `EXEC sp_rename 'maintenance_checklists', 'quarterly_controls'`,
    );
    await queryRunner.query(
      `EXEC sp_rename 'maintenance_checklist_items', 'quarterly_control_items'`,
    );

    // Rename the foreign key column in items table
    await queryRunner.query(
      `EXEC sp_rename 'quarterly_control_items.maintenance_checklist_id', 'quarterly_control_id', 'COLUMN'`,
    );

    // Re-add foreign key constraint with new names
    await queryRunner.query(`
      ALTER TABLE [quarterly_control_items] 
      ADD CONSTRAINT [FK_quarterly_control_items_quarterly_control_id] 
      FOREIGN KEY ([quarterly_control_id]) REFERENCES [quarterly_controls]([id]) 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE [quarterly_control_items] 
      DROP CONSTRAINT [FK_quarterly_control_items_quarterly_control_id]
    `);

    // Rename the foreign key column back
    await queryRunner.query(
      `EXEC sp_rename 'quarterly_control_items.quarterly_control_id', 'maintenance_checklist_id', 'COLUMN'`,
    );

    // Rename tables back
    await queryRunner.query(
      `EXEC sp_rename 'quarterly_controls', 'maintenance_checklists'`,
    );
    await queryRunner.query(
      `EXEC sp_rename 'quarterly_control_items', 'maintenance_checklist_items'`,
    );

    // Re-add original foreign key constraint
    await queryRunner.query(`
      ALTER TABLE [maintenance_checklist_items] 
      ADD CONSTRAINT [FK_maintenance_checklist_items_maintenance_checklist_id] 
      FOREIGN KEY ([maintenance_checklist_id]) REFERENCES [maintenance_checklists]([id]) 
      ON DELETE CASCADE
    `);
  }
}
