import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentTypes1773348600000 implements MigrationInterface {
  name = "CreateDocumentTypes1773348600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create document_types table
    await queryRunner.query(`
      CREATE TABLE document_types (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        code VARCHAR(50) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        entity_type VARCHAR(50) NOT NULL,
        has_expiration BIT NOT NULL DEFAULT 0,
        requires_file BIT NOT NULL DEFAULT 1,
        is_active BIT NOT NULL DEFAULT 1,
        CONSTRAINT UQ_document_types_code UNIQUE(code)
      )
    `);

    // Create index on code
    await queryRunner.query(`
      CREATE INDEX IDX_document_types_code ON document_types(code)
    `);

    // Seed initial document types
    await queryRunner.query(`
      INSERT INTO document_types (code, name, description, entity_type, has_expiration, requires_file) VALUES
      ('DNI', 'DNI', 'Documento Nacional de Identidad', 'USER', 1, 1),
      ('LICENSE', 'Licencia de Conducir', 'Registro de conductor', 'USER', 1, 1),
      ('VTV', 'VTV', 'Verificación Técnica Vehicular', 'VEHICLE', 1, 0),
      ('INSURANCE', 'Seguro', 'Póliza de seguro del vehículo', 'VEHICLE', 1, 1),
      ('VEHICLE_MANUAL', 'Manual del Vehículo', 'Manual de usuario del modelo', 'VEHICLE_MODEL', 0, 1),
      ('DRIVING_PERMIT', 'Permiso de Conducción', 'Autorización especial para conducir', 'ASSIGNMENT', 1, 1),
      ('PURCHASE_TICKET', 'Comprobante de Compra', 'Ticket o factura de compra', 'MAINTENANCE_RECORD', 0, 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE document_types`);
  }
}
