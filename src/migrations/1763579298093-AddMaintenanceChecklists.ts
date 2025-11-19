import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaintenanceChecklists1763579298093
  implements MigrationInterface
{
  name = "AddMaintenanceChecklists1763579298093";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create maintenance_checklists table
    await queryRunner.query(`
      CREATE TABLE [maintenance_checklists] (
        [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
        [vehicle_id] uniqueidentifier NOT NULL,
        [year] int NOT NULL,
        [quarter] int NOT NULL,
        [intended_delivery_date] date NOT NULL,
        [filled_by] uniqueidentifier NULL,
        [filled_at] date NULL,
        CONSTRAINT [PK_maintenance_checklists] PRIMARY KEY ([id]),
        CONSTRAINT [CHK_mc_quarter_range] CHECK ([quarter] >= 1 AND [quarter] <= 4),
        CONSTRAINT [FK_mc_vehicle] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_mc_filled_by] FOREIGN KEY ([filled_by]) REFERENCES [users]([id]) ON DELETE SET NULL
      )
    `);

    // Create indexes for maintenance_checklists
    await queryRunner.query(`
      CREATE INDEX [IDX_mc_vehicle_id] ON [maintenance_checklists] ([vehicle_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mc_year] ON [maintenance_checklists] ([year])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mc_quarter] ON [maintenance_checklists] ([quarter])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mc_filled_by] ON [maintenance_checklists] ([filled_by])
    `);

    // Create maintenance_checklist_items table
    await queryRunner.query(`
      CREATE TABLE [maintenance_checklist_items] (
        [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
        [maintenance_checklist_id] uniqueidentifier NOT NULL,
        [passed] bit NOT NULL DEFAULT ((0)),
        [observations] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_maintenance_checklist_items] PRIMARY KEY ([id]),
        CONSTRAINT [FK_mci_checklist] FOREIGN KEY ([maintenance_checklist_id]) REFERENCES [maintenance_checklists]([id]) ON DELETE CASCADE
      )
    `);

    // Create indexes for maintenance_checklist_items
    await queryRunner.query(`
      CREATE INDEX [IDX_mci_checklist_id] ON [maintenance_checklist_items] ([maintenance_checklist_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mci_passed] ON [maintenance_checklist_items] ([passed])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop maintenance_checklist_items table
    await queryRunner.query(`DROP TABLE [maintenance_checklist_items]`);

    // Drop maintenance_checklists table
    await queryRunner.query(`DROP TABLE [maintenance_checklists]`);
  }
}
