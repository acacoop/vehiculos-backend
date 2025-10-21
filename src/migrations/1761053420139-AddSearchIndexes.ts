import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchIndexes1761053420139 implements MigrationInterface {
  name = "AddSearchIndexes1761053420139";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_7e9fab2e8625b63613f67bd706" ON "vehicles" ("license_plate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_797d2e4daebc358d3223b75863" ON "users" ("cuit") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c62a4f9425f4f612a5f49d7002" ON "reservations" ("start_date") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_c62a4f9425f4f612a5f49d7002" ON "reservations"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_797d2e4daebc358d3223b75863" ON "users"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_7e9fab2e8625b63613f67bd706" ON "vehicles"`,
    );
  }
}
