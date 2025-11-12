import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMaintenanceRequirements1731427200000
  implements MigrationInterface
{
  name = "RefactorMaintenanceRequirements1731427200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla maintenances_requirements
    await queryRunner.query(`
      CREATE TABLE [maintenances_requirements] (
        [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
        [vehicle_id] uniqueidentifier NOT NULL,
        [maintenance_id] uniqueidentifier NOT NULL,
        [kilometers_frequency] int NULL,
        [days_frequency] int NULL,
        [observations] nvarchar(max) NULL,
        [instructions] nvarchar(max) NULL,
        [start_date] date NOT NULL,
        [end_date] date NULL,
        CONSTRAINT [PK_maintenances_requirements] PRIMARY KEY ([id]),
        CONSTRAINT [CHK_mr_km_freq_positive] CHECK ([kilometers_frequency] IS NULL OR [kilometers_frequency] >= 0),
        CONSTRAINT [CHK_mr_days_freq_positive] CHECK ([days_frequency] IS NULL OR [days_frequency] >= 0),
        CONSTRAINT [CHK_mr_end_after_start] CHECK ([end_date] IS NULL OR [end_date] >= [start_date]),
        CONSTRAINT [FK_mr_vehicle] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_mr_maintenance] FOREIGN KEY ([maintenance_id]) REFERENCES [maintenances]([id]) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mr_vehicle_id] ON [maintenances_requirements] ([vehicle_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mr_maintenance_id] ON [maintenances_requirements] ([maintenance_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mr_start_date] ON [maintenances_requirements] ([start_date])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_mr_end_date] ON [maintenances_requirements] ([end_date])
    `);

    // 2. Migrar datos de assigned_maintenances a maintenances_requirements
    // Usamos la fecha actual como start_date y NULL como end_date (sin fin)
    await queryRunner.query(`
      INSERT INTO [maintenances_requirements] (
        [id], 
        [vehicle_id], 
        [maintenance_id], 
        [kilometers_frequency], 
        [days_frequency], 
        [observations], 
        [instructions],
        [start_date],
        [end_date]
      )
      SELECT 
        [id], 
        [vehicle_id], 
        [maintenance_id], 
        [kilometers_frequency], 
        [days_frequency], 
        [observations], 
        [instructions],
        CAST(GETDATE() AS DATE),
        NULL
      FROM [assigned_maintenances]
    `);

    // 3. Agregar columnas maintenance_id y vehicle_id a maintenance_records
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD [maintenance_id] uniqueidentifier NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD [vehicle_id] uniqueidentifier NULL
    `);

    // 4. Copiar datos de las relaciones existentes
    await queryRunner.query(`
      UPDATE mr
      SET 
        mr.[maintenance_id] = am.[maintenance_id],
        mr.[vehicle_id] = am.[vehicle_id]
      FROM [maintenance_records] mr
      INNER JOIN [assigned_maintenances] am ON mr.[assigned_maintenance_id] = am.[id]
    `);

    // 5. Hacer las columnas NOT NULL
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ALTER COLUMN [maintenance_id] uniqueidentifier NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ALTER COLUMN [vehicle_id] uniqueidentifier NOT NULL
    `);

    // 6. Agregar índices y foreign keys
    await queryRunner.query(`
      CREATE INDEX [IDX_maintenance_records_maintenance] ON [maintenance_records] ([maintenance_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_maintenance_records_vehicle] ON [maintenance_records] ([vehicle_id])
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD CONSTRAINT [FK_maintenance_records_maintenance] FOREIGN KEY ([maintenance_id]) REFERENCES [maintenances]([id]) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD CONSTRAINT [FK_maintenance_records_vehicle] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE
    `);

    // 7. Eliminar la foreign key y columna antigua de assigned_maintenance_id
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP CONSTRAINT [FK_maintenance_records_assigned_maintenance]
    `);

    await queryRunner.query(`
      DROP INDEX [FK_maintenance_records_assigned_maintenance] ON [maintenance_records]
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP COLUMN [assigned_maintenance_id]
    `);

    // 8. Finalmente, eliminar la tabla assigned_maintenances
    await queryRunner.query(`DROP TABLE [assigned_maintenances]`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // IMPORTANTE: Esta migración es difícil de revertir sin pérdida de datos
    // porque estamos eliminando la tabla assigned_maintenances
    // Esta reversión es para propósitos de desarrollo/testing solamente

    // 1. Recrear tabla assigned_maintenances
    await queryRunner.query(`
      CREATE TABLE [assigned_maintenances] (
        [id] uniqueidentifier NOT NULL,
        [vehicle_id] uniqueidentifier NOT NULL,
        [maintenance_id] uniqueidentifier NOT NULL,
        [kilometers_frequency] int NULL,
        [days_frequency] int NULL,
        [observations] nvarchar(max) NULL,
        [instructions] nvarchar(max) NULL,
        CONSTRAINT [PK_assigned_maintenances] PRIMARY KEY ([id]),
        CONSTRAINT [FK_am_vehicle] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_am_maintenance] FOREIGN KEY ([maintenance_id]) REFERENCES [maintenances]([id]) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_am_vehicle_id] ON [assigned_maintenances] ([vehicle_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IDX_am_maintenance_id] ON [assigned_maintenances] ([maintenance_id])
    `);

    // 2. Restaurar datos desde maintenances_requirements
    await queryRunner.query(`
      INSERT INTO [assigned_maintenances] (
        [id], 
        [vehicle_id], 
        [maintenance_id], 
        [kilometers_frequency], 
        [days_frequency], 
        [observations], 
        [instructions]
      )
      SELECT 
        [id], 
        [vehicle_id], 
        [maintenance_id], 
        [kilometers_frequency], 
        [days_frequency], 
        [observations], 
        [instructions]
      FROM [maintenances_requirements]
      WHERE [end_date] IS NULL
    `);

    // 3. Agregar de vuelta la columna assigned_maintenance_id
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD [assigned_maintenance_id] uniqueidentifier NULL
    `);

    // 4. Intentar reconstruir la relación (no será 100% exacta)
    await queryRunner.query(`
      UPDATE mr
      SET mr.[assigned_maintenance_id] = am.[id]
      FROM [maintenance_records] mr
      INNER JOIN [assigned_maintenances] am 
        ON mr.[maintenance_id] = am.[maintenance_id] 
        AND mr.[vehicle_id] = am.[vehicle_id]
    `);

    // 5. Eliminar las foreign keys y columnas nuevas
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP CONSTRAINT [FK_maintenance_records_maintenance]
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP CONSTRAINT [FK_maintenance_records_vehicle]
    `);

    await queryRunner.query(`
      DROP INDEX [IDX_maintenance_records_maintenance] ON [maintenance_records]
    `);

    await queryRunner.query(`
      DROP INDEX [IDX_maintenance_records_vehicle] ON [maintenance_records]
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP COLUMN [maintenance_id]
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      DROP COLUMN [vehicle_id]
    `);

    // 6. Hacer assigned_maintenance_id NOT NULL y restaurar foreign key
    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ALTER COLUMN [assigned_maintenance_id] uniqueidentifier NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX [FK_maintenance_records_assigned_maintenance] ON [maintenance_records] ([assigned_maintenance_id])
    `);

    await queryRunner.query(`
      ALTER TABLE [maintenance_records]
      ADD CONSTRAINT [FK_maintenance_records_assigned_maintenance] FOREIGN KEY ([assigned_maintenance_id]) REFERENCES [assigned_maintenances]([id]) ON DELETE CASCADE
    `);

    // 7. Eliminar tabla maintenances_requirements
    await queryRunner.query(`DROP TABLE [maintenances_requirements]`);
  }
}
