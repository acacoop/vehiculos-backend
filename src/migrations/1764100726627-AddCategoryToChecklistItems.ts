import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToChecklistItems1764100726627
  implements MigrationInterface
{
  name = "AddCategoryToChecklistItems1764100726627";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE [maintenance_checklist_items] ADD [category] nvarchar(100) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE [maintenance_checklist_items] DROP COLUMN [category]`,
    );
  }
}
