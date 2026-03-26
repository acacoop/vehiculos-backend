import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocuments1773348700000 implements MigrationInterface {
  name = "CreateDocuments1773348700000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create documents table
    await queryRunner.query(`
      CREATE TABLE documents (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        document_type_id UNIQUEIDENTIFIER NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        uploaded_by UNIQUEIDENTIFIER NULL,
        uploaded_at DATETIME NOT NULL DEFAULT GETDATE(),
        start_date DATE NOT NULL,
        expiration_date DATE NULL,
        file_path NVARCHAR(500) NULL,
        file_storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
        is_current_version BIT NOT NULL DEFAULT 1,
        replaced_by UNIQUEIDENTIFIER NULL,
        notes NVARCHAR(1000) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_documents_document_type FOREIGN KEY (document_type_id) 
          REFERENCES document_types(id),
        CONSTRAINT FK_documents_uploaded_by FOREIGN KEY (uploaded_by) 
          REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT FK_documents_replaced_by FOREIGN KEY (replaced_by) 
          REFERENCES documents(id) ON DELETE NO ACTION,
        CONSTRAINT CHK_documents_expiration CHECK (expiration_date IS NULL OR expiration_date > start_date)
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IDX_documents_entity ON documents(entity_type, entity_id, document_type_id, is_current_version)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_documents_expiration_date ON documents(expiration_date)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_documents_uploaded_by ON documents(uploaded_by)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_documents_entity_type ON documents(entity_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE documents`);
  }
}
