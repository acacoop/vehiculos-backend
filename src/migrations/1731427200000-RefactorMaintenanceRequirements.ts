import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMaintenanceRequirements1731427200000
  implements MigrationInterface
{
  name = "RefactorMaintenanceRequirements1731427200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla maintenances_requirements
    await queryRunner.query(`
      CREATE TABLE \`maintenances_requirements\` (
        \`id\` varchar(36) NOT NULL,
        \`vehicle_id\` varchar(36) NOT NULL,
        \`maintenance_id\` varchar(36) NOT NULL,
        \`kilometers_frequency\` int NULL,
        \`days_frequency\` int NULL,
        \`observations\` text NULL,
        \`instructions\` text NULL,
        \`start_date\` date NOT NULL,
        \`end_date\` date NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_mr_vehicle_id\` (\`vehicle_id\`),
        INDEX \`IDX_mr_maintenance_id\` (\`maintenance_id\`),
        INDEX \`IDX_mr_start_date\` (\`start_date\`),
        INDEX \`IDX_mr_end_date\` (\`end_date\`),
        CONSTRAINT \`CHK_mr_km_freq_positive\` CHECK (\`kilometers_frequency\` IS NULL OR \`kilometers_frequency\` > 0),
        CONSTRAINT \`CHK_mr_days_freq_positive\` CHECK (\`days_frequency\` IS NULL OR \`days_frequency\` > 0),
        CONSTRAINT \`CHK_mr_end_after_start\` CHECK (\`end_date\` IS NULL OR \`end_date\` >= \`start_date\`),
        CONSTRAINT \`FK_mr_vehicle\` FOREIGN KEY (\`vehicle_id\`) REFERENCES \`vehicles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_mr_maintenance\` FOREIGN KEY (\`maintenance_id\`) REFERENCES \`maintenances\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    // 2. Migrar datos de assigned_maintenances a maintenances_requirements
    // Usamos la fecha actual como start_date y NULL como end_date (sin fin)
    await queryRunner.query(`
      INSERT INTO \`maintenances_requirements\` (
        \`id\`, 
        \`vehicle_id\`, 
        \`maintenance_id\`, 
        \`kilometers_frequency\`, 
        \`days_frequency\`, 
        \`observations\`, 
        \`instructions\`,
        \`start_date\`,
        \`end_date\`
      )
      SELECT 
        \`id\`, 
        \`vehicle_id\`, 
        \`maintenance_id\`, 
        \`kilometers_frequency\`, 
        \`days_frequency\`, 
        \`observations\`, 
        \`instructions\`,
        CURDATE(),
        NULL
      FROM \`assigned_maintenances\`
    `);

    // 3. Agregar columnas maintenance_id y vehicle_id a maintenance_records
    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      ADD COLUMN \`maintenance_id\` varchar(36) NULL AFTER \`id\`,
      ADD COLUMN \`vehicle_id\` varchar(36) NULL AFTER \`maintenance_id\`
    `);

    // 4. Copiar datos de las relaciones existentes
    await queryRunner.query(`
      UPDATE \`maintenance_records\` mr
      INNER JOIN \`assigned_maintenances\` am ON mr.assigned_maintenance_id = am.id
      SET 
        mr.maintenance_id = am.maintenance_id,
        mr.vehicle_id = am.vehicle_id
    `);

    // 5. Hacer las columnas NOT NULL y agregar foreign keys
    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      MODIFY COLUMN \`maintenance_id\` varchar(36) NOT NULL,
      MODIFY COLUMN \`vehicle_id\` varchar(36) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      ADD INDEX \`IDX_mr_maintenance_id\` (\`maintenance_id\`),
      ADD INDEX \`IDX_mr_vehicle_id\` (\`vehicle_id\`),
      ADD CONSTRAINT \`FK_mr_maintenance\` FOREIGN KEY (\`maintenance_id\`) REFERENCES \`maintenances\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
      ADD CONSTRAINT \`FK_mr_vehicle\` FOREIGN KEY (\`vehicle_id\`) REFERENCES \`vehicles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // 6. Eliminar la foreign key y columna antigua de assigned_maintenance_id
    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      DROP FOREIGN KEY \`FK_maintenance_records_assigned_maintenance\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      DROP INDEX \`FK_maintenance_records_assigned_maintenance\`,
      DROP COLUMN \`assigned_maintenance_id\`
    `);

    // 7. Finalmente, eliminar la tabla assigned_maintenances
    await queryRunner.query(`DROP TABLE \`assigned_maintenances\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // IMPORTANTE: Esta migración es difícil de revertir sin pérdida de datos
    // porque estamos eliminando la tabla assigned_maintenances
    // Esta reversión es para propósitos de desarrollo/testing solamente

    // 1. Recrear tabla assigned_maintenances
    await queryRunner.query(`
      CREATE TABLE \`assigned_maintenances\` (
        \`id\` varchar(36) NOT NULL,
        \`vehicle_id\` varchar(36) NOT NULL,
        \`maintenance_id\` varchar(36) NOT NULL,
        \`kilometers_frequency\` int NULL,
        \`days_frequency\` int NULL,
        \`observations\` text NULL,
        \`instructions\` text NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_am_vehicle_id\` (\`vehicle_id\`),
        INDEX \`IDX_am_maintenance_id\` (\`maintenance_id\`),
        CONSTRAINT \`FK_am_vehicle\` FOREIGN KEY (\`vehicle_id\`) REFERENCES \`vehicles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_am_maintenance\` FOREIGN KEY (\`maintenance_id\`) REFERENCES \`maintenances\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    // 2. Restaurar datos desde maintenances_requirements
    await queryRunner.query(`
      INSERT INTO \`assigned_maintenances\` (
        \`id\`, 
        \`vehicle_id\`, 
        \`maintenance_id\`, 
        \`kilometers_frequency\`, 
        \`days_frequency\`, 
        \`observations\`, 
        \`instructions\`
      )
      SELECT 
        \`id\`, 
        \`vehicle_id\`, 
        \`maintenance_id\`, 
        \`kilometers_frequency\`, 
        \`days_frequency\`, 
        \`observations\`, 
        \`instructions\`
      FROM \`maintenances_requirements\`
      WHERE \`end_date\` IS NULL
    `);

    // 3. Agregar de vuelta la columna assigned_maintenance_id
    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      ADD COLUMN \`assigned_maintenance_id\` varchar(36) NULL AFTER \`id\`
    `);

    // 4. Intentar reconstruir la relación (no será 100% exacta)
    await queryRunner.query(`
      UPDATE \`maintenance_records\` mr
      INNER JOIN \`assigned_maintenances\` am 
        ON mr.maintenance_id = am.maintenance_id 
        AND mr.vehicle_id = am.vehicle_id
      SET mr.assigned_maintenance_id = am.id
    `);

    // 5. Eliminar las columnas nuevas
    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      DROP FOREIGN KEY \`FK_mr_maintenance\`,
      DROP FOREIGN KEY \`FK_mr_vehicle\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      DROP INDEX \`IDX_mr_maintenance_id\`,
      DROP INDEX \`IDX_mr_vehicle_id\`,
      DROP COLUMN \`maintenance_id\`,
      DROP COLUMN \`vehicle_id\`
    `);

    // 6. Restaurar foreign key de assigned_maintenance_id
    await queryRunner.query(`
      ALTER TABLE \`maintenance_records\`
      MODIFY COLUMN \`assigned_maintenance_id\` varchar(36) NOT NULL,
      ADD INDEX \`FK_maintenance_records_assigned_maintenance\` (\`assigned_maintenance_id\`),
      ADD CONSTRAINT \`FK_maintenance_records_assigned_maintenance\` FOREIGN KEY (\`assigned_maintenance_id\`) REFERENCES \`assigned_maintenances\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // 7. Eliminar tabla maintenances_requirements
    await queryRunner.query(`DROP TABLE \`maintenances_requirements\``);
  }
}
